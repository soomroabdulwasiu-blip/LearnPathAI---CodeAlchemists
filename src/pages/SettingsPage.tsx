import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import { GmailConfigModal } from '../components/auth/GmailConfigModal';
import {
  User,
  Globe,
  Sun,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Mail,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    setUser,
    theme,
    setTheme,
    language,
    setLanguage,
    reducedMotion,
    setReducedMotion,
    resetProgress,
    masteryMap,
  } = useAppStore();

  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState(user?.goal || 'Master Python Fundamentals');
  const [hours, setHours] = useState(user?.weeklyHours || 5);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name, goal, weeklyHours: hours });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportData = () => {
    const data = {
      profile: user,
      masteryMap,
      exportedAt: new Date().toISOString(),
      platform: 'LearnPath AI 2026',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnpath-progress-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    try {
      await api.logout();
    } catch {}
    resetProgress();
    setShowDeleteConfirm(false);
    navigate('/login');
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            {t('profile_settings')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Customize your adaptive learning parameters and account preferences.
          </p>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4" />
            <span>Learning parameters saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-5">
          <h3 className="font-display font-bold text-base text-[var(--ink)] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2D5BFF]" />
            Learner Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--ink)]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--ink)]">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--muted)] border border-[var(--line)] opacity-70 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--ink)]">Primary Learning Target</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[var(--ink)]">{t('weekly_target')}</label>
              <span className="font-mono font-bold text-[#2D5BFF]">{hours} hours / week</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value, 10))}
              className="w-full accent-[#2D5BFF] h-2 bg-[var(--line)] rounded-lg cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" size="md" className="font-bold cursor-pointer">
              {t('save_changes')}
            </Button>
          </div>
        </form>

        {/* Gmail Sender Configuration Card */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[var(--ink)] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EA4335]" />
                Official Google Gmail Delivery Engine
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Connect your Google Account to dispatch real OTP verification emails to students and password recovery.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGmailModalOpen(true)}
              className="border-[#4285F4]/40 text-[#4285F4] hover:bg-[#4285F4]/10 cursor-pointer"
            >
              Configure Gmail
            </Button>
          </div>
        </div>

        {/* Interface Preferences */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-5">
          <h3 className="font-display font-bold text-base text-[var(--ink)]">
            Interface & Accessibility
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] space-y-2">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2D5BFF]" />
                {t('language')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#2D5BFF] text-white border-[#2D5BFF]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`p-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    language === 'ur'
                      ? 'bg-[#2D5BFF] text-white border-[#2D5BFF]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                >
                  اردو (RTL)
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] space-y-2">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#FFB92E]" />
                {t('theme')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[#2D5BFF] text-white border-[#2D5BFF]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#2D5BFF] text-white border-[#2D5BFF]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--ink)]">{t('reduced_motion')}</h4>
              <p className="text-[11px] text-[var(--muted)]">
                Disable node movement springs and ambient animations.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-5 h-5 accent-[#2D5BFF] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Data Management & Export */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink)]">
            Data Portability & Account Controls
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <Button variant="outline" onClick={handleExportData} className="cursor-pointer">
              <Download className="w-4 h-4 mr-1.5 text-[#2D5BFF]" />
              <span>{t('export_data')}</span>
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>{t('reset_data')}</span>
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Are you sure you want to reset all learning progress?</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                This will clear your local and session storage, logging you out and restoring an initial uncalibrated state.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleReset}
                  className="cursor-pointer"
                >
                  Yes, Reset Everything
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GmailConfigModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
      />
    </>
  );
};
