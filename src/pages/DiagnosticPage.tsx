import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { SEED_QUESTIONS } from '../data/seedData';
import { TOPICS, TOPIC_MAP } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Gauge,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Flag,
} from 'lucide-react';

export const DiagnosticPage: React.FC = () => {
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const { applyAnswerEvaluation } = useAppStore();
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [difficultyTier, setDifficultyTier] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [difficultyValue, setDifficultyValue] = useState(30);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});

  const totalQuestions = 12;
  const currentQuestion = SEED_QUESTIONS[currentIndex % SEED_QUESTIONS.length];
  const topicMeta = TOPIC_MAP[currentQuestion.topic_id];

  const handleStart = async () => {
    try {
      const res = await api.startDiagnostic();
      setSessionId(res.session_id);
    } catch {
      setSessionId(`session-${Date.now()}`);
    }
    setHasStarted(true);
  };

  useEffect(() => {
    if (!hasStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < currentQuestion.options.length) {
            handleSelectOption(idx);
          }
        }
      } else {
        if (e.key === 'Enter') {
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isAnswered, currentQuestion, currentIndex]);

  const handleSelectOption = async (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    const isCorrect = idx === currentQuestion.correctIndex;

    applyAnswerEvaluation(currentQuestion.topic_id, isCorrect);

    if (sessionId) {
      try {
        await api.answerDiagnostic(sessionId, currentQuestion.id, idx);
      } catch (e) {
        console.error('Error submitting answer to server:', e);
      }
    }

    if (isCorrect) {
      setDifficultyValue((prev) => Math.min(95, prev + 15));
      if (difficultyValue + 15 > 70) setDifficultyTier('advanced');
      else if (difficultyValue + 15 > 45) setDifficultyTier('intermediate');
    } else {
      setDifficultyValue((prev) => Math.max(15, prev - 12));
      if (difficultyValue - 12 < 40) setDifficultyTier('beginner');
      else if (difficultyValue - 12 < 65) setDifficultyTier('intermediate');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= totalQuestions) {
      navigate('/results');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2D5BFF]/10 text-[#2D5BFF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bayesian Knowledge Calibration</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[var(--ink)]">
            Python Fundamentals Diagnostic
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            Assess your current Python knowledge to generate an adaptive, prerequisite-aware learning roadmap that updates after every problem you solve.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-6">
          <h3 className="font-display font-bold text-base text-[var(--ink)]">
            Assessment Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Subject</span>
              <span className="text-xs font-bold text-[var(--ink)] mt-0.5 block">Python</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Questions</span>
              <span className="text-xs font-bold text-[#2D5BFF] mt-0.5 block">12 Adaptive</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Duration</span>
              <span className="text-xs font-bold text-[var(--ink)] mt-0.5 block">~8 Minutes</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Difficulty</span>
              <span className="text-xs font-bold text-[#10B981] mt-0.5 block">Dynamic Dial</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--ink)]">Curriculum Dimensions Covered:</span>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.hue }} />
                  <span>{t.title}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#2D5BFF]/5 border border-[#2D5BFF]/15 text-xs text-[var(--muted)] leading-relaxed">
            <strong className="text-[var(--ink)] font-semibold">How Adaptation Works:</strong> Each correct response increases difficulty and unlocks advanced prerequisite branches. If a question is missed, our Bayesian model isolates the gap and prioritizes foundational review.
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => navigate('/dashboard')} className="cursor-pointer">
              Return to Dashboard
            </Button>
            <Button
              size="lg"
              onClick={handleStart}
              className="font-bold shadow-md shadow-[#2D5BFF]/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Diagnostic Quiz</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-sm text-[var(--ink)]">
              {t('question_of', { current: currentIndex + 1, total: totalQuestions })}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: topicMeta?.hue }}
            />
            <span className="font-medium text-[var(--ink)]">
              {isRtl ? topicMeta?.titleUrdu : topicMeta?.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 text-xs cursor-pointer ${
                flaggedQuestions[currentIndex]
                  ? 'text-[#F59E0B] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{flaggedQuestions[currentIndex] ? 'Flagged' : 'Flag'}</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 hover:text-[var(--ink)] transition-colors cursor-pointer text-xs"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Quiz</span>
            </button>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-[var(--line)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2D5BFF] to-[#7C3AED] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-sm)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-[#2D5BFF]" />
            <span className="text-xs font-bold text-[var(--ink)]">{t('difficulty')}:</span>
            <Badge
              size="sm"
              variant={
                difficultyTier === 'advanced'
                  ? 'danger'
                  : difficultyTier === 'intermediate'
                  ? 'warning'
                  : 'info'
              }
            >
              {t(difficultyTier)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-40 sm:w-56">
            <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] border border-[var(--line)] overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#06B6D4] via-[#F59E0B] to-[#F87171]"
                style={{ width: `${difficultyValue}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-[var(--muted)] font-bold">
              {difficultyValue}%
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 sm:p-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)] space-y-6"
        >
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-[var(--ink)] leading-snug">
              {isRtl ? currentQuestion.questionUrdu || currentQuestion.question : currentQuestion.question}
            </h2>
          </div>

          {currentQuestion.codeSnippet && (
            <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] font-code text-xs sm:text-sm text-[var(--ink)] overflow-x-auto leading-relaxed shadow-xs">
              <pre>{currentQuestion.codeSnippet}</pre>
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              let optStyle =
                'border-[var(--line)] bg-[var(--surface)] hover:border-[#2D5BFF]/50 hover:bg-[var(--surface-hover)] hover:-translate-y-0.5 shadow-xs';
              if (isAnswered) {
                if (isSelected) {
                  optStyle = isCorrect
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                    : 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold shadow-sm';
                } else if (isCorrect) {
                  optStyle =
                    'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-medium';
                } else {
                  optStyle = 'border-[var(--line)] opacity-40';
                }
              }
              return (
                <motion.button
                  key={idx}
                  disabled={isAnswered}
                  whileHover={!isAnswered ? { x: 4, scale: 1.006 } : undefined}
                  whileTap={!isAnswered ? { scale: 0.99 } : undefined}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm text-left transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center font-bold text-xs text-[var(--muted)]">
                      {idx + 1}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isAnswered && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      ) : null}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-4 border-t border-[var(--line)] space-y-4"
            >
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm border leading-relaxed ${
                  selectedOption === currentQuestion.correctIndex
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-200'
                }`}
              >
                <div className="font-bold font-display mb-1 flex items-center gap-1.5">
                  {selectedOption === currentQuestion.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {t('correct')}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500" />
                      {t('incorrect')}
                    </>
                  )}
                </div>
                <p className="text-xs text-[var(--ink)] mt-1">
                  {isRtl
                    ? currentQuestion.explanationUrdu || currentQuestion.explanation
                    : currentQuestion.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--muted)] hidden sm:inline">
                  {t('keyboard_hint')}
                </span>
                <Button
                  size="lg"
                  onClick={handleNextQuestion}
                  variant={currentIndex + 1 >= totalQuestions ? 'ai-solid' : 'primary'}
                  withSparkle={currentIndex + 1 >= totalQuestions}
                  className="font-bold ml-auto shadow-md cursor-pointer"
                >
                  <span>
                    {currentIndex + 1 >= totalQuestions ? 'View Calibration Results' : t('next')}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
