import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Home, GitBranch, PlayCircle, BarChart3, User, Terminal } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    { to: '/dashboard', label: t('home'), icon: Home },
    { to: '/roadmap', label: t('roadmap'), icon: GitBranch },
    { to: '/practice', label: t('practice'), icon: PlayCircle },
    { to: '/codelab', label: t('code_lab'), icon: Terminal },
    { to: '/progress', label: t('progress'), icon: BarChart3 },
    { to: '/settings', label: t('profile'), icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--line)] shadow-lg pb-safe safe-area-bottom">
      <div className="grid grid-cols-6 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[#2D5BFF] dark:text-[#A78BFA] font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-[#2D5BFF] to-[#7C3AED]"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-115 text-[#2D5BFF] dark:text-[#A78BFA]' : ''
                    }`}
                  />
                  <span className="truncate max-w-[48px]">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
