import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { api } from '../../api/client';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';

export const TutorDrawer: React.FC = () => {
  const {
    tutorDrawerOpen,
    closeTutor,
    tutorActiveQuestion,
    tutorMessages,
    addTutorMessage,
  } = useAppStore();
  const { t, isRtl } = useTranslation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tutorMessages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      text: query,
      timestamp: Date.now(),
    };
    addTutorMessage(userMsg);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.explainConcept(tutorActiveQuestion?.id || 'var-1', query);
      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant' as const,
        text: res.text,
        timestamp: Date.now(),
        sources: res.sources,
        suggestedFollowUps: ['Can you show me an example?', 'Why does Python behave this way?'],
      };
      addTutorMessage(assistantMsg);
    } catch {
      addTutorMessage({
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'I am currently calibrating your response in offline mode. Review the topic lesson to deepen foundational comprehension.',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {tutorDrawerOpen && (
        <motion.div
          key="tutor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeTutor}
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
        >
          <motion.div
            key="tutor-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-full bg-[var(--surface)] border-l border-[var(--line)] shadow-[var(--shadow-lg)] flex flex-col justify-between"
          >
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-muted)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2D5BFF] to-[#7C3AED] flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
                    {t('tutor_title')}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">{t('offline_notice')}</p>
                </div>
              </div>
              <button
                onClick={closeTutor}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                aria-label="Close tutor drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tutorActiveQuestion && (
              <div className="px-4 py-2.5 bg-gradient-to-r from-[#2D5BFF]/10 to-[#7C3AED]/10 border-b border-[#2D5BFF]/20 text-xs text-[var(--ink)]">
                <span className="font-semibold text-[#2D5BFF]">
                  {isRtl ? 'فعال سیاق و سباق:' : 'Active Context:'}
                </span>{' '}
                <span className="text-[var(--muted)]">
                  {isRtl
                    ? tutorActiveQuestion.questionUrdu || tutorActiveQuestion.question
                    : tutorActiveQuestion.question}
                </span>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {tutorMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-[#2D5BFF] to-[#7C3AED] text-white shadow-xs rounded-br-xs'
                          : 'bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] shadow-xs rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleSendMessage(followUp)}
                            className="text-[11px] font-semibold text-[#2D5BFF] hover:text-[#7C3AED] flex items-center gap-1.5 bg-[#2D5BFF]/10 hover:bg-[#2D5BFF]/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer text-left"
                          >
                            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                            <span>{followUp}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] p-3 rounded-2xl bg-[var(--surface-muted)] w-fit border border-[var(--line)] animate-pulse shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D5BFF]" />
                  <span>Analyzing Python syntax semantics...</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[var(--line)] bg-[var(--surface)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('tutor_placeholder')}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#2D5BFF] to-[#7C3AED] hover:from-[#204AE0] hover:to-[#6D28D9] text-white flex items-center justify-center disabled:opacity-40 transition-all shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:shadow-[#2D5BFF]/20 active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
