import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import {
  Flame,
  Zap,
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  ChevronRight,
  Mail,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../api/client';
import { ProjectLogo } from '../common/ProjectLogo';
import { GmailConfigModal } from '../auth/GmailConfigModal';

export const Header: React.FC<{ onOpenSidebar?: () => void }> = ({ onOpenSidebar }) => {
  const {
    user,
    theme,
    setTheme,
    language,
    setLanguage,
    notifications,
    markNotificationsAsRead,
    setCommandPalette,
    logoutUser,
  } = useAppStore();
  const { t, isRtl } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      logoutUser();
      navigate('/login');
    }
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Overview';
      case '/roadmap':
        return 'My Learning Path';
      case '/diagnostic':
        return 'Diagnostic Assessment';
      case '/results':
        return 'Calibration Results';
      case '/practice':
        return 'Practice Center';
      case '/codelab':
        return 'Python Code Lab';
      case '/resources':
        return 'Learning Resources';
      case '/assistant':
        return 'AI Study Assistant';
      case '/progress':
        return 'Progress & Analytics';
      case '/goals':
        return 'My Goals';
      case '/history':
        return 'Quiz History';
      case '/settings':
        return 'My Profile';
      case '/instructor/classes':
        return 'Instructor Classes';
      case '/instructor/content':
        return 'Content Manager';
      default:
        if (path.startsWith('/topics/')) return 'Lesson Overview';
        if (path.startsWith('/instructor/classes/')) return 'Class Insights';
        return 'LearnPath AI';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <>
      <header className="sticky top-0 z-20 w-full backdrop-blur-xl bg-[var(--surface)]/90 border-b border-[var(--line)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Left: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-3">
            {onOpenSidebar && (
              <button
                onClick={onOpenSidebar}
                className="lg:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] cursor-pointer"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Link to="/dashboard" className="hidden sm:flex items-center font-bold text-[var(--muted)] hover:text-[var(--ink)]">
                <ProjectLogo size="sm" variant="icon-only" />
              </Link>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="font-display font-extrabold text-sm sm:text-base text-[var(--ink)]">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[#2D5BFF]/40 text-xs transition-all cursor-pointer shadow-2xs"
              aria-label="Open command palette"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('search_placeholder').split('(')[0].trim()}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Live Gmail Sender Status Button */}
            <button
              onClick={() => setGmailModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border border-[#4285F4]/25 transition-all cursor-pointer"
              title="Configure live official Gmail delivery"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Gmail Sender</span>
            </button>

            {/* Admin Panel Quick Access */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/25 transition-all shadow-2xs"
                title="Admin Data Management"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            {/* Streak Chip */}
            {user && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF6B57]/10 text-[#FF6B57] border border-[#FF6B57]/20 select-none"
                title={`${user.streak} day streak`}
              >
                <Flame className="w-3.5 h-3.5 fill-[#FF6B57]" />
                <span>{user.streak}</span>
              </div>
            )}

            {/* XP Chip */}
            {user && (
              <div
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B] border border-[#F59E0B]/25 select-none"
                title={`Level ${user.level} (${user.xp} XP)`}
              >
                <Zap className="w-3.5 h-3.5 fill-[#F59E0B]" />
                <span>{user.xp} XP</span>
              </div>
            )}

            {/* Notifications Popover Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) markNotificationsAsRead();
                }}
                className="relative p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B57]" />
                )}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-lg)] p-3 z-50`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)]">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)]">
                        {isRtl ? 'سرگرمیاں' : 'Activity & Recommendations'}
                      </span>
                      <Badge size="sm" variant="info">
                        {notifications.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-[var(--muted)] text-center py-4">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl bg-[var(--surface-muted)] text-xs border border-[var(--line)] flex flex-col gap-1 hover:border-[#2D5BFF]/30 transition-colors"
                          >
                            <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-[var(--muted)] font-normal">{n.time}</span>
                            </div>
                            <p className="text-[var(--muted)] leading-relaxed">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] border border-[var(--line)] transition-colors cursor-pointer active:scale-95"
              title="Switch Language"
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'اردو' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* User Avatar Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-1.5 p-1 pl-1.5 rounded-full border border-[var(--line)] hover:border-[#2D5BFF]/50 transition-all cursor-pointer bg-[var(--surface-muted)] active:scale-95"
                  aria-label="User Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2D5BFF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] mr-1" />
                </button>
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-lg)] p-2 z-50`}
                      onClick={() => setAvatarOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
                        <p className="text-sm font-bold text-[var(--ink)] truncate">{user.name}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge
                            size="sm"
                            variant={user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'warning' : 'info'}
                          >
                            {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Instructor' : 'Student'}
                          </Badge>
                          <span className="text-[11px] text-[var(--muted)]">{user.weeklyHours}h/wk target</span>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[var(--surface-hover)] text-[var(--ink)] transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-[var(--muted)]" />
                        <span>{t('profile')}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <Badge variant="info" size="sm" className="cursor-pointer">
                  Sign In
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Gmail Sender Configuration Modal */}
      <GmailConfigModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
      />
    </>
  );
};
