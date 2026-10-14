import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RoadmapItem, TopicId } from '../../types';
import { TOPIC_MAP, getMasteryLevel } from '../../lib/constants';
import { useTranslation } from '../../i18n';
import { ProgressRing } from '../ui/ProgressRing';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  CheckCircle2,
  Play,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  masteryMap: Record<TopicId, number>;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ items, masteryMap }) => {
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();

  const recommendedTopicId =
    items.find((i) => i.status !== 'locked' && i.status !== 'skip')?.topic_id;

  return (
    <div className="relative space-y-4">
      <div
        aria-hidden="true"
        className="absolute left-7 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#2D5BFF] via-[#7C3AED]/40 to-[var(--line)] hidden md:block pointer-events-none"
      />

      {items.map((item, index) => {
        const meta = TOPIC_MAP[item.topic_id];
        if (!meta) return null;
        const score = masteryMap[item.topic_id] ?? 0;
        const tier = getMasteryLevel(score);
        const isLocked = item.status === 'locked';
        const isMastered = item.status === 'skip';
        const isRecommended = item.topic_id === recommendedTopicId;
        const movedUp = item.previous_rank !== undefined && item.rank < item.previous_rank;
        const movedDown = item.previous_rank !== undefined && item.rank > item.previous_rank;

        return (
          <motion.div
            key={item.topic_id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={`relative p-5 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isRecommended
                ? 'bg-[var(--surface)] border-[#2D5BFF]/60 shadow-[0_4px_20px_-2px_rgba(45,91,255,0.18)] ring-2 ring-[#2D5BFF]/20'
                : isLocked
                ? 'bg-[var(--surface-muted)] border-[var(--line)] opacity-60'
                : 'bg-[var(--surface)] border-[var(--line)] hover:border-[#2D5BFF]/40 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-start md:items-center gap-4 relative z-1">
              <div
                className={`w-11 h-11 rounded-2xl text-white font-display font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs relative transition-transform duration-200 ${
                  isRecommended ? 'scale-105 shadow-md shadow-[#2D5BFF]/30' : ''
                }`}
                style={{ backgroundColor: meta.hue }}
              >
                #{item.rank}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)]">
                    {isRtl ? meta.titleUrdu : meta.title}
                  </h4>

                  {isRecommended && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#2D5BFF] bg-[#2D5BFF]/10 dark:bg-[#2D5BFF]/20 dark:text-[#A78BFA] px-2 py-0.5 rounded-full border border-[#2D5BFF]/25 shadow-xs animate-pulse">
                      <Sparkles className="w-3 h-3 text-[#7C3AED]" /> Recommended Next
                    </span>
                  )}

                  {movedUp && (
                    <span className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight className="w-3 h-3" /> Advanced #{item.previous_rank} → #{item.rank}
                    </span>
                  )}

                  {movedDown && (
                    <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      <ArrowDownRight className="w-3 h-3" /> Shifted #{item.previous_rank} → #{item.rank}
                    </span>
                  )}

                  {isLocked ? (
                    <span className="text-[10px] font-semibold text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded-full border border-[var(--line)] inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> {t('status_locked')}
                    </span>
                  ) : isMastered ? (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 inline-flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t('status_skip')}
                    </span>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.badgeBg}`}>
                      {isRtl ? tier.labelUrdu : tier.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed max-w-2xl">
                  {isRtl ? item.whyUrdu : item.why}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)] relative z-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.est_minutes} {t('minutes')}</span>
              </div>
              <ProgressRing progress={score} size={46} strokeWidth={4} color={meta.hue} />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/topics/${item.topic_id}`)}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('view_lesson')}</span>
                </Button>
                {!isLocked && (
                  <Button
                    size="sm"
                    variant={isRecommended ? 'primary' : 'secondary'}
                    onClick={() => navigate(`/practice?topic=${item.topic_id}`)}
                    className={isRecommended ? 'font-bold shadow-md shadow-[#2D5BFF]/25' : ''}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">{t('start_practice')}</span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
