import { Router, Response } from 'express';
import { db, generateToken } from '../db/store';
import { UserProfile } from '../../types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { adminAuth } from '../../lib/firebase-admin.ts';

export const authRouter = Router();

function generate6DigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 1. Sign in with email and password
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    const mins = Math.ceil(freeze.remainingSeconds / 60);
    const hours = (freeze.remainingSeconds / 3600).toFixed(1);
    const timeStr = freeze.remainingSeconds >= 3600 ? `${hours} hours` : `${mins} minutes`;
    return res.status(403).json({
      error: `Account is temporarily frozen due to 3 failed verification attempts. It will automatically unlock in ${timeStr}.`,
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
      frozenUntil: freeze.frozenUntil,
    });
  }

  try {
    const result = db.verifyCredentials(emailTrimmed, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials or register an account.' });
    }
    res.json({
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    return res.status(403).json({
      error: err.message || 'Authentication failed.',
      isFrozen: true,
    });
  }
});

// 2. Direct Account Signup
authRouter.post('/signup', (req, res) => {
  const { name, email, password, role, classCode } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const emailTrimmed = String(email).trim().toLowerCase();
  const existing = db.getUserByEmail(emailTrimmed);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.' });
  }

  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    const mins = Math.ceil(freeze.remainingSeconds / 60);
    const hours = (freeze.remainingSeconds / 3600).toFixed(1);
    const timeStr = freeze.remainingSeconds >= 3600 ? `${hours} hours` : `${mins} minutes`;
    return res.status(403).json({
      error: `This email is temporarily frozen due to 3 failed attempts. It will automatically unlock in ${timeStr}.`,
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
      frozenUntil: freeze.frozenUntil,
    });
  }

  const newUser: UserProfile = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    email: emailTrimmed,
    role: role === 'instructor' ? 'instructor' : 'student',
    classCode: classCode ? String(classCode).trim() : undefined,
    weeklyHours: 5,
    level: 1,
    streak: 0,
    xp: 0,
    goal: 'Master Python Fundamentals',
    expRating: 'beginner',
    hasCompletedDiagnostic: false,
    completedAssessmentsCount: 0,
    joinedAt: new Date().toISOString().split('T')[0],
  };

  try {
    const result = db.createUser(newUser, password);
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// 3. Forgot Password - Request OTP (strictly requires and uses real Gmail OTP dispatch)
authRouter.post('/forgot-password/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Please enter your account email address.' });
  }
  const emailTrimmed = email.trim().toLowerCase();

  const userRecord = db.getUserByEmail(emailTrimmed);
  if (!userRecord) {
    return res.status(404).json({
      error: `No registered account found for ${emailTrimmed}. Please check your spelling or create an account.`,
    });
  }

  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    const mins = Math.ceil(freeze.remainingSeconds / 60);
    const hours = (freeze.remainingSeconds / 3600).toFixed(1);
    const timeStr = freeze.remainingSeconds >= 3600 ? `${hours} hours` : `${mins} minutes`;
    return res.status(403).json({
      error: `This account is temporarily frozen due to 3 failed attempts. It will automatically unlock in ${timeStr}.`,
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
      frozenUntil: freeze.frozenUntil,
    });
  }

  // Check if real Gmail SMTP is connected
  if (!emailService.isConfigured()) {
    return res.status(400).json({
      success: false,
      needsGmailConfig: true,
      error: `Real Gmail OTP delivery is not yet connected. Please enter your Gmail sender credentials so the genuine verification code can be delivered to ${emailTrimmed}.`,
      email: emailTrimmed,
    });
  }

  const existingOtp = db.getOtpRecord(emailTrimmed, 'forgot_password');
  if (existingOtp && Date.now() - existingOtp.lastSentAt < 60000) {
    const waitSec = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSec} seconds before requesting a new verification code.`,
      waitSeconds: waitSec,
    });
  }

  const otp = generate6DigitOtp();
  db.setOtpRecord({
    email: emailTrimmed,
    otp,
    type: 'forgot_password',
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    lastSentAt: Date.now(),
    attempts: existingOtp ? existingOtp.attempts : 0,
  });

  const emailRes = await emailService.sendOtpEmail({
    to: emailTrimmed,
    otp,
    type: 'forgot_password',
    name: userRecord.profile.name,
  });

  if (!emailRes.success) {
    return res.status(500).json({
      success: false,
      needsGmailConfig: true,
      error: emailRes.error || `Failed to dispatch real OTP email to ${emailTrimmed} via Gmail. Please verify your Gmail App Password.`,
    });
  }

  res.json({
    success: true,
    message: `Official 6-digit verification code sent to ${emailTrimmed} via Gmail! Check your inbox.`,
    cooldownSeconds: 60,
    method: 'gmail',
    senderEmail: emailRes.senderEmail,
    attemptsRemaining: 3 - (existingOtp ? existingOtp.attempts : 0),
  });
});

// 4. Forgot Password - Resend OTP
authRouter.post('/forgot-password/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const emailTrimmed = String(email).trim().toLowerCase();
  const userRecord = db.getUserByEmail(emailTrimmed);
  if (!userRecord) {
    return res.status(404).json({ error: 'No registered account found with this email.' });
  }

  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    const mins = Math.ceil(freeze.remainingSeconds / 60);
    return res.status(403).json({
      error: `Account is temporarily frozen for 2 hours. Unlock in ${mins} minutes.`,
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
    });
  }

  if (!emailService.isConfigured()) {
    return res.status(400).json({
      success: false,
      needsGmailConfig: true,
      error: `Gmail sender credentials are required to resend real verification codes.`,
      email: emailTrimmed,
    });
  }

  const record = db.getOtpRecord(emailTrimmed, 'forgot_password');
  if (!record) {
    return res.status(400).json({ error: 'Reset session expired. Please enter your email again.' });
  }

  if (Date.now() - record.lastSentAt < 60000) {
    const waitSec = Math.ceil((60000 - (Date.now() - record.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSec} seconds before resending the code.`,
      waitSeconds: waitSec,
    });
  }

  const newOtp = generate6DigitOtp();
  record.otp = newOtp;
  record.lastSentAt = Date.now();
  record.expiresAt = Date.now() + 10 * 60 * 1000;
  db.setOtpRecord(record);

  const emailRes = await emailService.sendOtpEmail({
    to: emailTrimmed,
    otp: newOtp,
    type: 'forgot_password',
    name: userRecord.profile.name,
  });

  if (!emailRes.success) {
    return res.status(500).json({
      success: false,
      needsGmailConfig: true,
      error: emailRes.error || `Failed to dispatch real OTP to ${emailTrimmed}. Check sender credentials.`,
    });
  }

  res.json({
    success: true,
    message: `A new official verification code was sent to ${emailTrimmed} via Gmail.`,
    cooldownSeconds: 60,
    method: 'gmail',
    senderEmail: emailRes.senderEmail,
    attemptsRemaining: 3 - record.attempts,
  });
});

// 5. Forgot Password - Verify OTP
authRouter.post('/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required.' });
  }
  const emailTrimmed = String(email).trim().toLowerCase();
  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    const mins = Math.ceil(freeze.remainingSeconds / 60);
    return res.status(403).json({
      error: `Account is temporarily frozen due to 3 failed attempts. Please try again after 2 hours (${mins} min remaining).`,
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
    });
  }

  const record = db.getOtpRecord(emailTrimmed, 'forgot_password');
  if (!record) {
    return res.status(400).json({ error: 'Verification code expired or not found. Please request a new code.' });
  }

  if (String(otp).trim() !== record.otp) {
    record.attempts += 1;
    db.setOtpRecord(record);
    if (record.attempts >= 3) {
      const frozenUntil = db.freezeEmail(emailTrimmed, 2 * 60 * 60 * 1000);
      return res.status(403).json({
        error: 'You have entered the wrong code 3 times. For your security, this account is frozen and will reopen after 2 hours.',
        isFrozen: true,
        remainingAttempts: 0,
        frozenUntil,
        remainingSeconds: 7200,
      });
    }
    const remaining = 3 - record.attempts;
    return res.status(400).json({
      error: `Incorrect verification code. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account is frozen.`,
      remainingAttempts: remaining,
      isFrozen: false,
    });
  }

  db.deleteOtpRecord(emailTrimmed, 'forgot_password');
  const resetToken = db.createResetToken(emailTrimmed);
  res.json({
    success: true,
    message: 'Code verified successfully! You may now set your new password.',
    resetToken,
  });
});

// 6. Forgot Password - Set New Password
authRouter.post('/forgot-password/reset', (req, res) => {
  const { email, resetToken, newPassword, confirmPassword } = req.body;
  if (!email || !resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const emailTrimmed = String(email).trim().toLowerCase();

  const freeze = db.isEmailFrozen(emailTrimmed);
  if (freeze.isFrozen) {
    return res.status(403).json({
      error: 'Account is temporarily frozen.',
      isFrozen: true,
      remainingSeconds: freeze.remainingSeconds,
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'The two passwords do not match. Please ensure both fields are identical.' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const isValidToken = db.verifyResetToken(emailTrimmed, resetToken);
  if (!isValidToken) {
    return res.status(400).json({ error: 'Invalid or expired password reset session. Please request a new code.' });
  }

  const updated = db.updatePassword(emailTrimmed, newPassword);
  if (!updated) {
    return res.status(404).json({ error: 'Failed to update password. Account not found.' });
  }

  db.deleteResetToken(resetToken);
  res.json({
    success: true,
    message: 'Your password has been successfully updated! You can now log in with your new password.',
  });
});

// 7. Check Freeze Status
authRouter.get('/freeze-status', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }
  const freeze = db.isEmailFrozen(email);
  res.json({
    email,
    isFrozen: freeze.isFrozen,
    remainingSeconds: freeze.remainingSeconds,
    frozenUntil: freeze.frozenUntil,
  });
});

// 8. Gmail Sender Configuration Endpoints
authRouter.get('/gmail-config/status', (_req, res) => {
  res.json(emailService.getStatus());
});

authRouter.post('/gmail-config/save', async (req, res) => {
  const { gmailUser, gmailAppPassword, sendOtpTo } = req.body;
  if (!gmailUser || !gmailAppPassword) {
    return res.status(400).json({ error: 'Gmail address and 16-character App Password are required.' });
  }
  emailService.setCredentials(gmailUser, gmailAppPassword, true);
  const verifyRes = await emailService.verifyConnection();
  if (!verifyRes.success) {
    return res.status(400).json({
      error: verifyRes.message,
      status: emailService.getStatus(),
    });
  }

  let otpDispatched = false;
  let otpTarget = '';
  if (sendOtpTo && typeof sendOtpTo === 'string') {
    const targetEmail = sendOtpTo.trim().toLowerCase();
    otpTarget = targetEmail;
    const user = db.getUserByEmail(targetEmail);
    if (user) {
      const otp = generate6DigitOtp();
      db.setOtpRecord({
        email: targetEmail,
        otp,
        type: 'forgot_password',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        lastSentAt: Date.now(),
        attempts: 0,
      });
      const sendRes = await emailService.sendOtpEmail({
        to: targetEmail,
        otp,
        type: 'forgot_password',
        name: user.profile.name,
      });
      otpDispatched = sendRes.success;
    }
  }

  res.json({
    ...emailService.getStatus(),
    otpDispatched,
    otpTarget,
    message: otpDispatched
      ? `Gmail SMTP connected and real OTP sent to ${otpTarget}!`
      : `Gmail SMTP connected successfully!`,
  });
});

// Google / Firebase Sign-In
authRouter.post('/google-login', async (req, res) => {
  let { email, name, idToken } = req.body;
  let uid = '';

  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded.email) email = decoded.email;
      if (decoded.name) name = decoded.name;
      if (decoded.uid) uid = decoded.uid;
    } catch (tokenErr) {
      console.warn('[Firebase Auth] Notice verifying ID token:', tokenErr);
    }
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Google Account email is required.' });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const isAdminEmail = emailTrimmed === 'soomroabdulwasiu@gmail.com' || emailTrimmed === 'admin@learnpath.ai';
  let userRecord = db.getUserByEmail(emailTrimmed);

  if (!userRecord) {
    const newUser = db.upsertSocialUser({
      id: uid || `user-${Date.now()}`,
      name: name || emailTrimmed.split('@')[0],
      email: emailTrimmed,
      role: isAdminEmail ? 'admin' : 'student',
      avatarSeed: name || emailTrimmed,
      goal: 'Learn Python programming',
      weeklyHours: 5,
      expRating: 'beginner',
      joinedAt: new Date().toISOString(),
      streak: 1,
      xp: 100,
      level: 1,
      hasCompletedDiagnostic: false,
      completedAssessmentsCount: 0,
    });
    return res.json({
      success: true,
      message: 'Signed in with Google successfully!',
      user: newUser.user,
      token: newUser.token,
    });
  }

  if (isAdminEmail && userRecord.profile.role !== 'admin') {
    userRecord.profile.role = 'admin';
  }

  const token = generateToken(userRecord.profile.id);
  res.json({
    success: true,
    message: 'Signed in with Google successfully!',
    user: userRecord.profile,
    token,
  });
});

authRouter.post('/firebase-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Firebase ID token is required.' });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email || '';
    const name = decoded.name || email.split('@')[0] || 'Python Explorer';
    const emailLower = email.toLowerCase().trim();
    const isAdminEmail = emailLower === 'soomroabdulwasiu@gmail.com' || emailLower === 'admin@learnpath.ai';
    const userRes = db.upsertSocialUser({
      id: decoded.uid,
      name,
      email,
      role: isAdminEmail ? 'admin' : 'student',
      avatarSeed: name,
      goal: 'Learn Python programming',
      weeklyHours: 5,
      expRating: 'beginner',
      joinedAt: new Date().toISOString(),
      streak: 1,
      xp: 100,
      level: 1,
      hasCompletedDiagnostic: false,
      completedAssessmentsCount: 0,
    });
    res.json({
      success: true,
      message: 'Authenticated with Firebase!',
      user: userRes.user,
      token: userRes.token,
    });
  } catch (err: any) {
    console.error('Firebase token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
  }
});

authRouter.post('/gmail-config/test', async (req, res) => {
  const { recipientEmail } = req.body;
  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return res.status(400).json({ error: 'Recipient email is required.' });
  }
  if (!emailService.isConfigured()) {
    return res.status(400).json({ error: 'Gmail sender credentials have not been configured yet.' });
  }

  const testOtp = generate6DigitOtp();
  const sendRes = await emailService.sendOtpEmail({
    to: recipientEmail,
    otp: testOtp,
    type: 'test',
  });

  if (sendRes.method === 'gmail' && sendRes.success) {
    res.json({
      success: true,
      message: `Real test OTP (${testOtp}) dispatched via Gmail to ${recipientEmail}! Check your inbox.`,
    });
  } else {
    res.status(500).json({
      success: false,
      message: sendRes.error || 'Failed to dispatch email via Gmail.',
    });
  }
});

// 9. Profile & Logout
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  res.json(user);
});

authRouter.post('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});
