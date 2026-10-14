import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface GmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
  targetEmail?: string;
  onOtpDispatched?: () => void;
}

export const GmailConfigModal: React.FC<GmailConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
  targetEmail,
  onOtpDispatched,
}) => {
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    senderEmail: string | null;
  }>({
    isConfigured: false,
    senderEmail: null,
  });
  const [loading, setLoading] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadConfigStatus();
    if (targetEmail) {
      setTestRecipient(targetEmail);
    }
  }, [isOpen, targetEmail]);

  const loadConfigStatus = async () => {
    try {
      const res = await api.getGmailConfigStatus();
      setStatus({
        isConfigured: res.isConfigured,
        senderEmail: res.senderEmail,
      });
      if (res.senderEmail) {
        setGmailUser(res.senderEmail);
      } else if (targetEmail) {
        setGmailUser(targetEmail);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailUser.trim() || !gmailAppPassword.trim()) {
      toast.error('Both Gmail address and 16-character App Password are required.');
      return;
    }
    setLoading(true);
    setTestResult(null);
    try {
      const res = await api.saveGmailConfig({
        gmailUser: gmailUser.trim(),
        gmailAppPassword: gmailAppPassword.trim().replace(/\s+/g, ''),
        sendOtpTo: targetEmail?.trim() || undefined,
      });
      setStatus({
        isConfigured: res.isConfigured,
        senderEmail: res.senderEmail,
      });
      onConfigUpdated?.();

      if (res.otpDispatched && targetEmail) {
        toast.success(`Connected! Official OTP sent to ${targetEmail} via Gmail. Check your inbox.`);
        onOtpDispatched?.();
        onClose();
      } else {
        toast.success('Gmail SMTP sender connected and authenticated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to authenticate with Gmail SMTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    const target = testRecipient.trim() || gmailUser.trim();
    if (!target) {
      toast.error('Please enter a recipient email address to send the test OTP.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGmailConnection(target);
      setTestResult({
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        toast.success(`Real OTP sent to ${target}! Please check your Gmail inbox.`);
      } else {
        toast.error(res.message || 'Failed to send test email.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
      toast.error(err.message || 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EA4335] via-[#4285F4] to-[#34A853] text-white flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-[var(--ink)]">
                Connect Official Gmail Delivery
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {targetEmail
                  ? `Send real-time verification OTP directly to ${targetEmail}`
                  : 'Dispatch genuine verification OTP emails via official Google Gmail SMTP'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
              Official Google SMTP Pipeline
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink)]">
                {status.isConfigured ? 'Active & Ready for Live Delivery' : 'Credentials Required for Real Inbox Delivery'}
              </span>
              <Badge size="sm" variant={status.isConfigured ? 'success' : 'warning'}>
                {status.isConfigured ? 'Connected' : 'Setup Required'}
              </Badge>
            </div>
            {status.senderEmail && (
              <span className="text-[11px] text-[var(--muted)] block font-mono">
                Authenticated Sender: {status.senderEmail}
              </span>
            )}
          </div>
        </div>

        {/* 3-Step Guide to getting Google App Password */}
        <div className="p-4 rounded-2xl bg-[#4285F4]/5 border border-[#4285F4]/20 space-y-2.5 text-xs text-[var(--muted)]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#4285F4] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              How to create your 16-character Google App Password (in 30s):
            </span>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="text-[#4285F4] hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
            >
              <span>Open Google Security</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed text-[var(--ink)]">
            <li>Ensure <strong>2-Step Verification</strong> is enabled in your Google Account.</li>
            <li>Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#4285F4] font-semibold underline">myaccount.google.com/apppasswords</a>.</li>
            <li>Enter app name <strong>LearnPath AI</strong> and click <strong>Create</strong>.</li>
            <li>Google generates a 16-character code (e.g. <code className="bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono text-[10px]">abcd efgh ijkl mnop</code>). Paste it below.</li>
          </ol>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--ink)]">Your Gmail Address (Sender)</label>
            <input
              type="email"
              required
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#4285F4] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--ink)]">Google App Password (16 characters)</label>
            <input
              type="password"
              required
              value={gmailAppPassword}
              onChange={(e) => setGmailAppPassword(e.target.value)}
              placeholder="16-character Google app password"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#4285F4] font-mono"
            />
            <span className="text-[10px] text-[var(--muted)] block">
              Google requires an App Password (not your account password) to send emails via official SMTP.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold shadow-md shadow-[#4285F4]/25 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              <span>
                {targetEmail
                  ? `Connect & Send Real OTP to ${targetEmail}`
                  : 'Save & Authenticate Gmail'}
              </span>
            </Button>
          </div>
        </form>

        {/* Live Test Section */}
        {status.isConfigured && (
          <div className="pt-4 border-t border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#34A853]" />
                Send Real Test OTP to Your Inbox
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                SMTP Connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={`Recipient (default: ${gmailUser || 'your email'})`}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#34A853]"
              />
              <Button
                size="sm"
                onClick={handleSendTestEmail}
                loading={testing}
                className="bg-[#34A853] hover:bg-[#2D8E47] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                <span>Send Real Email</span>
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.success && (
                    <p className="text-[11px] mt-1 opacity-90">
                      Check your Gmail inbox now (and spam folder) to view the official OTP email!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
