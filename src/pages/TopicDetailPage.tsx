import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { TOPIC_MAP, getMasteryLevel } from '../lib/constants';
import { SEED_LESSONS } from '../data/seedData';
import { TopicId } from '../types';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import {
  Play,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';

export const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { masteryMap, openTutor } = useAppStore();

  const validTopicId = (topicId as TopicId) || 'variables';
  const meta = TOPIC_MAP[validTopicId] || TOPIC_MAP.variables;
  const lesson = SEED_LESSONS[validTopicId] || SEED_LESSONS.variables;
  const score = masteryMap[validTopicId] ?? 0;
  const tier = getMasteryLevel(score);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => navigate('/roadmap')}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('back_to_roadmap')}</span>
      </button>

      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: meta.hue }}
            />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)]">
              Curriculum Module
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            {isRtl ? meta.titleUrdu : meta.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl">
            {isRtl ? meta.descriptionUrdu : meta.description}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tier.badgeBg}`}>
              {isRtl ? tier.labelUrdu : tier.label} ({score}%)
            </span>
            <span className="text-xs text-[var(--muted)]">
              Est. Study Duration: {meta.standardEstMinutes} mins
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <ProgressRing progress={score} size={64} strokeWidth={6} color={meta.hue} />
            <span className="text-[10px] text-[var(--muted)] block mt-1">Mastery</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="md"
              onClick={() => navigate(`/practice?topic=${validTopicId}`)}
              className="font-bold shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{t('start_practice')}</span>
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => openTutor(validTopicId)}
              className="cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2D5BFF]" />
              <span>{t('ask_tutor')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] space-y-6">
        <div>
          <h2 className="font-display font-extrabold text-xl text-[var(--ink)]">
            Conceptual Deep Dive
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
            {isRtl ? lesson.overviewUrdu : lesson.overview}
          </p>
        </div>

        <div className="space-y-6">
          {lesson.keyConcepts.map((concept, idx) => (
            <div key={idx} className="space-y-2.5">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                {idx + 1}. {concept.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {concept.body}
              </p>
              {concept.code && (
                <div className="relative rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] p-4 font-code text-xs sm:text-sm text-[var(--ink)] overflow-x-auto group">
                  <button
                    onClick={() => handleCopyCode(concept.code!, idx)}
                    className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    aria-label="Copy code snippet"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                  <pre className="leading-relaxed">{concept.code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {lesson.commonPitfalls.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-xs text-amber-700 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span>Common Python Pitfalls to Avoid</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-xs text-[var(--ink)]">
              {lesson.commonPitfalls.map((pitfall, i) => (
                <li key={i}>{pitfall}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
