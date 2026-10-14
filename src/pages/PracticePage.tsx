import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { SEED_QUESTIONS } from '../data/seedData';
import { TOPICS, TOPIC_MAP, getMasteryLevel } from '../lib/constants';
import { TopicId, Question } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  GitCompare,
  Play,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

export const PracticePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { masteryMap, applyAnswerEvaluation, openTutor } = useAppStore();

  const queryTopic = searchParams.get('topic') as TopicId | null;
  const isDirectPractice = Boolean(queryTopic);
  const [activeTopicId, setActiveTopicId] = useState<TopicId>(queryTopic || 'variables');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const weakestTopicId =
    (Object.entries(masteryMap).sort(([, a], [, b]) => a - b)[0]?.[0] as TopicId) || 'variables';
  const weakestMeta = TOPIC_MAP[weakestTopicId];

  const topicQuestions = SEED_QUESTIONS.filter((q) => {
    const matchTopic = q.topic_id === activeTopicId;
    const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchTopic && matchDiff;
  });

  const [questionIdx, setQuestionIdx] = useState(0);
  const currentQuestion: Question =
    topicQuestions[questionIdx % (topicQuestions.length || 1)] || SEED_QUESTIONS[0];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [diffToast, setDiffToast] = useState<{
    oldScore: number;
    newScore: number;
    diff: any[];
  } | null>(null);

  const currentScore = masteryMap[activeTopicId] ?? 0;
  const meta = TOPIC_MAP[activeTopicId];
  const tier = getMasteryLevel(currentScore);

  useEffect(() => {
    if (queryTopic) {
      setActiveTopicId(queryTopic);
    }
  }, [queryTopic]);

  const handleSelect = async (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
    setIsSubmitted(true);
    const isCorrect = idx === currentQuestion.correctIndex;
    const res = applyAnswerEvaluation(currentQuestion.topic_id, isCorrect);
    setDiffToast(res);
    try {
      await api.submitPractice(currentQuestion.id, idx);
    } catch {
      // ignore
    }
    if (isCorrect) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setDiffToast(null);
    setQuestionIdx((prev) => prev + 1);
  };

  const startTopicPractice = (tid: TopicId) => {
    setActiveTopicId(tid);
    setSearchParams({ topic: tid });
    setSelectedOption(null);
    setIsSubmitted(false);
    setDiffToast(null);
    setQuestionIdx(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2D5BFF]/10 text-[#2D5BFF] mb-2">
            <Play className="w-3.5 h-3.5 fill-[#2D5BFF]" />
            <span>Targeted Practice Center</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            Practice Center
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Reinforce weak concepts, solve adaptive question sets, and see your Bayesian mastery update in real time.
          </p>
        </div>
        {isDirectPractice && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSearchParams({})}
            className="cursor-pointer"
          >
            ← View All Practice Sets
          </Button>
        )}
      </div>

      {!isDirectPractice && weakestMeta && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#FF6B57]/10 via-[#F59E0B]/10 to-[#2D5BFF]/10 border border-[#FF6B57]/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider text-[#FF6B57]">
              <Target className="w-4 h-4" />
              <span>Recommended Practice Target</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-[var(--ink)]">
              Focus Topic: {weakestMeta.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-lg leading-relaxed">
              Your current calibrated score is <strong className="text-rose-600 font-bold">{masteryMap[weakestTopicId] ?? 0}%</strong>. Solving targeted practice questions reinforces foundational prerequisites.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <ProgressRing
                progress={masteryMap[weakestTopicId] ?? 0}
                size={58}
                strokeWidth={5}
                color="#FF6B57"
              />
              <span className="text-[10px] text-[var(--muted)] block mt-1">Mastery</span>
            </div>
            <Button
              size="lg"
              onClick={() => startTopicPractice(weakestTopicId)}
              className="bg-[#FF6B57] hover:bg-[#E85642] text-white font-bold shadow-md shadow-[#FF6B57]/25 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Practice {weakestMeta.title.split(' ')[0]}</span>
            </Button>
          </div>
        </div>
      )}

      {isDirectPractice ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: meta?.hue }}
              />
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  {meta?.title}
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  Practice Session • Question #{questionIdx + 1}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressRing progress={currentScore} size={42} strokeWidth={4} color={meta?.hue} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => openTutor(activeTopicId, currentQuestion)}
                className="cursor-pointer"
              >
                <span>{t('ask_tutor')}</span>
              </Button>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={questionIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                    <span className="font-bold uppercase tracking-wider text-[#2D5BFF]">
                      Difficulty: {currentQuestion.difficulty}
                    </span>
                    <span>Bayesian Knowledge Evaluation</span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)] leading-snug">
                    {isRtl ? currentQuestion.questionUrdu || currentQuestion.question : currentQuestion.question}
                  </h3>
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
                    if (isSubmitted) {
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
                        disabled={isSubmitted}
                        whileHover={!isSubmitted ? { x: 4, scale: 1.006 } : undefined}
                        whileTap={!isSubmitted ? { scale: 0.99 } : undefined}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        onClick={() => handleSelect(idx)}
                        className={`w-full p-4 rounded-2xl border text-xs sm:text-sm text-left transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center font-bold text-xs text-[var(--muted)]">
                            {idx + 1}
                          </span>
                          <span>{option}</span>
                        </div>
                        {isSubmitted && (
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

                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="pt-4 border-t border-[var(--line)] space-y-4"
                  >
                    {diffToast && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2D5BFF]/10 to-[#7C3AED]/10 border border-[#2D5BFF]/20 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <GitCompare className="w-4 h-4 text-[#2D5BFF] shrink-0" />
                          <span className="font-semibold text-[var(--ink)]">
                            BKT Mastery: {diffToast.oldScore}% → {diffToast.newScore}%
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/roadmap')}
                          className="text-[#2D5BFF] text-xs font-bold cursor-pointer"
                        >
                          View Roadmap Diff →
                        </Button>
                      </div>
                    )}
                    <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] text-xs sm:text-sm leading-relaxed text-[var(--ink)]">
                      <span className="font-bold text-[#2D5BFF] block mb-1">
                        {t('explanation')}:
                      </span>
                      <p>
                        {isRtl
                          ? currentQuestion.explanationUrdu || currentQuestion.explanation
                          : currentQuestion.explanation}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ai"
                        withSparkle={true}
                        onClick={() => openTutor(activeTopicId, currentQuestion)}
                        className="cursor-pointer"
                      >
                        <span>Ask AI Study Assistant</span>
                      </Button>
                      <Button size="lg" onClick={handleNext} className="font-bold shadow-md cursor-pointer">
                        <span>Next Question</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
              All Topic Practice Sets (10 Topics)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--muted)] font-semibold">Filter:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOPICS.map((topic) => {
              const score = masteryMap[topic.id] ?? 0;
              const count = SEED_QUESTIONS.filter((q) => q.topic_id === topic.id).length;
              return (
                <Card
                  key={topic.id}
                  variant="interactive"
                  className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] hover:border-[#2D5BFF]/40 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: topic.hue }}
                      />
                      <ProgressRing progress={score} size={42} strokeWidth={4} color={topic.hue} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-[var(--ink)]">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)] font-mono">
                      {count} questions • ~{topic.standardEstMinutes}m
                    </span>
                    <Button
                      size="sm"
                      onClick={() => startTopicPractice(topic.id)}
                      className="font-bold cursor-pointer shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white mr-1" />
                      <span>Practice</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
