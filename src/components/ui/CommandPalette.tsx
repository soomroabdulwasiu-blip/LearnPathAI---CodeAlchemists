import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { TOPICS } from '../../lib/constants';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  PlayCircle,
  GitBranch,
  BookOpen,
  Terminal,
  BarChart3,
  Flame,
  Settings,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPalette } = useAppStore();
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPalette(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPalette]);

  const quickPages = [
    { label: t('dashboard'), to: '/dashboard', icon: BarChart3 },
    { label: t('roadmap'), to: '/roadmap', icon: GitBranch },
    { label: t('practice'), to: '/practice', icon: PlayCircle },
    { label: t('code_lab'), to: '/codelab', icon: Terminal },
    { label: t('review'), to: '/review', icon: Flame },
    { label: t('settings'), to: '/settings', icon: Settings },
  ];

  const filteredTopics = TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(query.toLowerCase()) ||
      topic.titleUrdu.includes(query) ||
      topic.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPages = quickPages.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPage = (to: string) => {
    navigate(to);
    setCommandPalette(false);
    setQuery('');
  };

  const handleSelectTopic = (topicId: string) => {
    navigate(`/topics/${topicId}`);
    setCommandPalette(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          key="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setCommandPalette(false)}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/55 backdrop-blur-sm"
        >
          <motion.div
            key="cmd-dialog"
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            <div className="flex items-center px-4 py-3.5 border-b border-[var(--line)] gap-3 bg-[var(--surface-muted)]">
              <Search className="w-5 h-5 text-[var(--muted)] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isRtl ? 'کمانڈ یا عنوان تلاش کریں...' : 'Type a command, page, or topic...'
                }
                autoFocus
                className="w-full bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none"
              />
              <button
                onClick={() => setCommandPalette(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto space-y-4">
              {filteredPages.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-[11px] font-bold font-display uppercase tracking-wider text-[var(--muted)]">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {filteredPages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <button
                          key={page.to}
                          onClick={() => handleSelectPage(page.to)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-hover)] hover:text-[#2D5BFF] transition-colors text-left cursor-pointer group"
                        >
                          <Icon className="w-4 h-4 text-[var(--muted)] group-hover:text-[#2D5BFF] group-hover:scale-110 transition-transform" />
                          <span>{page.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {filteredTopics.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-[11px] font-bold font-display uppercase tracking-wider text-[var(--muted)]">
                    Curriculum Topics
                  </p>
                  <div className="space-y-1">
                    {filteredTopics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-hover)] hover:text-[#2D5BFF] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                            style={{ backgroundColor: topic.hue }}
                          />
                          <span>{isRtl ? topic.titleUrdu : topic.title}</span>
                        </div>
                        <span className="text-[10px] text-[var(--muted)] font-mono">
                          {topic.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-[var(--line)] bg-[var(--surface-muted)] text-[11px] text-[var(--muted)] flex items-center justify-between">
              <span>Navigate with keyboard, select with Enter</span>
              <kbd className="px-2 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] font-mono text-[10px] shadow-xs">
                ESC to close
              </kbd>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
