import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  LayoutDashboard,
  GitBranch,
  FileQuestion,
  PlayCircle,
  BookOpen,
  Sparkles,
  BarChart3,
  Target,
  History,
  User,
  LogOut,
  X,
  Code2,
  ChevronRight,
  Flame,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../api/client';
import { ProjectLogo } from '../common/ProjectLogo';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logoutUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

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

  const mainMenuItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/roadmap', label: 'My Learning Path', icon: GitBranch },
    { to: '/diagnostic', label: 'Diagnostic Assessment', icon: FileQuestion },
    { to: '/practice', label: 'Practice Center', icon: PlayCircle },
    { to: '/codelab', label: 'Python Code Lab', icon: Code2 },
    { to: '/resources', label: 'Learning Resources', icon: BookOpen },
    { to: '/assistant', label: 'AI Study Assistant', icon: Sparkles, badge: 'AI' },
    { to: '/progress', label: 'Progress & Analytics', icon: BarChart3 },
  ];

  const personalMenuItems = [
    { to: '/goals', label: 'My Goals', icon: Target },
    { to: '/history', label: 'Quiz History', icon: History },
    { to: '/settings', label: 'My Profile', icon: User },
  ];

  const instructorMenuItems = [
    { to: '/instructor/classes', label: 'Class Cohorts', icon: GraduationCap },
    { to: '/instructor/content', label: 'Question Bank', icon: BookOpen },
  ];

  const adminMenuItems = [
    { to: '/admin', label: 'Admin Mission Control', icon: ShieldAlert, badge: 'Root' },
    { to: '/instructor/classes', label: 'Cohorts Directory', icon: GraduationCap },
    { to: '/instructor/content', label: 'Questions Inspector', icon: BookOpen },
  ];

  const renderNavList = (items: typeof mainMenuItems) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold select-none group cursor-pointer transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2D5BFF]/15 to-[#7C3AED]/10 border border-[#2D5BFF]/30 shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-bar"
                className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-gradient-to-b from-[#2D5BFF] to-[#7C3AED]"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0"
            >
              <Icon
                className={`w-4 h-4 transition-colors duration-200 ${
                  isActive
                    ? 'text-[#2D5BFF] dark:text-[#A78BFA]'
                    : 'text-[var(--muted)] group-hover:text-[var(--ink)]'
                }`}
              />
            </motion.div>
            <span
              className={`flex-1 truncate transition-colors duration-200 ${
                isActive
                  ? 'text-[#2D5BFF] dark:text-[#A78BFA] font-bold'
                  : 'text-[var(--muted)] group-hover:text-[var(--ink)]'
              }`}
            >
              {item.label}
            </span>
            {item.badge && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#7C3AED]/15 text-[#7C3AED] uppercase">
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-[var(--surface)] text-[var(--ink)] border-r border-[var(--line)] w-64 lg:w-[264px] select-none">
      <div className="space-y-5">
        <div className="flex items-center justify-between px-2 pt-1">
          <div
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer group"
          >
            <ProjectLogo size="sm" variant="full" animated={true} />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {user && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="mx-1 p-2.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-between text-xs transition-shadow hover:shadow-xs"
          >
            <div className="flex items-center gap-1.5 font-bold text-[#FF6B57]">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-4 h-4 fill-[#FF6B57]" />
              </motion.div>
              <span>{user.streak} Days</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-[#F59E0B]">
              <Zap className="w-4 h-4 fill-[#F59E0B]" />
              <span>{user.xp} XP</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
          <div>
            <span className="px-3 pb-1.5 block text-[10px] font-bold font-display uppercase tracking-wider text-[var(--muted)]">
              Main Menu
            </span>
            {renderNavList(mainMenuItems)}
          </div>

          <div>
            <span className="px-3 pb-1.5 block text-[10px] font-bold font-display uppercase tracking-wider text-[var(--muted)]">
              Personal
            </span>
            {renderNavList(personalMenuItems)}
          </div>

          {user?.role === 'instructor' && (
            <div>
              <span className="px-3 pb-1.5 block text-[10px] font-bold font-display uppercase tracking-wider text-[#F59E0B]">
                Instructor Area
              </span>
              {renderNavList(instructorMenuItems)}
            </div>
          )}

          {user?.role === 'admin' && (
            <div>
              <span className="px-3 pb-1.5 flex items-center gap-1.5 text-[10px] font-bold font-display uppercase tracking-wider text-rose-500">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                Admin Area
              </span>
              {renderNavList(adminMenuItems)}
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="pt-3 border-t border-[var(--line)] space-y-2.5">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/settings')}
            className="p-2.5 rounded-2xl bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--line)] flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2D5BFF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-[var(--ink)] block truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-[var(--muted)] block">
                  Level {user.level} • {user.role === 'instructor' ? 'Instructor' : 'Student'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
          </motion.div>

          <div className="flex items-center justify-between px-2 text-xs text-[var(--muted)]">
            <span className="text-[11px] font-semibold text-[var(--muted)] capitalize">
              Role: {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="hover:text-rose-500 text-[11px] flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed top-0 bottom-0 left-0 z-30 w-64 lg:w-[264px] h-screen">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-72 h-full shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
