import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { TOPIC_MAP, TOPICS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Clock, FastForward, Play } from 'lucide-react';
import { motion } from 'motion/react';

export const ReviewPage: React.FC = () => {
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const { timeOffsetDays, advanceTime, masteryMap, user } = useAppStore();
  const [advancing, setAdvancing] = useState(false);

  const handleSimulateDecay = () => {
    setAdvancing(true);
    advanceTime(7);
    setTimeout(() => setAdvancing(false), 300);
  };

  const hasScores = Object.values(masteryMap).some((score) => score > 0);
  const hasCompletedDiagnostic = Boolean(user?.hasCompletedDiagnostic || hasScores);

  const assessedTopics = TOPICS.filter((t) => (masteryMap[t.id] ?? 0) > 0);
  const reviewQueue = assessedTopics.map((topic, index) => {
    const score = masteryMap[topic.id] ?? 0;
    const decayedRetention = Math.max(10, Math.round(score * (0.94 ** (timeOffsetDays + index))));
    return {
      topic_id: topic.id,
      retentionPercent: decayedRetention,
      dueDate: decayedRetention < 50 ? 'Immediate' : 'In 3 days',
      status: decayedRetention < 50 ? ('critical' as const) : ('due' as const),
    };
  });

  if (!hasCompletedDiagnostic || reviewQueue.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#8A5CF6]/10 text-[#8A5CF6] flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Your memory review queue will appear after completing assessments.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              LearnPath AI uses the Ebbinghaus forgetting curve to schedule spaced review sessions once you have practiced topics.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/diagnostic')}
            className="font-bold cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white mr-1.5" />
            <span>Start Diagnostic Quiz</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8A5CF6]/10 text-[#8A5CF6] mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Ebbinghaus Forgetting Curve</span>
          </div>
          <h1 className="font-display font-black text-2xl text-[var(--ink)]">
            {t('review_title')}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {t('review_subtitle')} (Simulated offset: +{timeOffsetDays} days)
          </p>
        </div>
        <Button
          size="md"
          variant="secondary"
          onClick={handleSimulateDecay}
          loading={advancing}
          className="shrink-0 cursor-pointer border-[#8A5CF6]/30 text-[#8A5CF6] hover:bg-[#8A5CF6]/10 font-bold"
        >
          <FastForward className="w-4 h-4 mr-1.5" />
          <span>{t('simulate_decay')}</span>
        </Button>
      </div>

      <div className="space-y-4">
        {reviewQueue.map((item) => {
          const meta = TOPIC_MAP[item.topic_id];
          if (!meta) return null;
          const isCritical = item.status === 'critical';
          return (
            <motion.div
              key={item.topic_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isCritical
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-[var(--surface)] border-[var(--line)] shadow-xs hover:border-[#2D5BFF]/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: meta.hue }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                      {isRtl ? meta.titleUrdu : meta.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      Due {item.dueDate}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Estimated Memory Retention: {item.retentionPercent}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]">
                <ProgressRing
                  progress={item.retentionPercent}
                  size={44}
                  strokeWidth={4}
                  color={item.retentionPercent < 50 ? '#FF6B57' : meta.hue}
                />
                <Button
                  size="sm"
                  variant={isCritical ? 'danger' : 'primary'}
                  onClick={() => navigate(`/practice?topic=${item.topic_id}`)}
                  className="font-bold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{t('review_now')}</span>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
