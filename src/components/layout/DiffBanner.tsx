import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { Sparkles, ArrowUpRight, ArrowDownRight, X, GitCompare } from 'lucide-react';
import { TOPIC_MAP } from '../../lib/constants';

export const DiffBanner: React.FC = () => {
  const { latestDiff, activeDiffDismissed, dismissDiffBanner } = useAppStore();
  const { isRtl } = useTranslation();

  if (!latestDiff || latestDiff.length === 0 || activeDiffDismissed) {
    return null;
  }

  return (
    <div className="relative z-40 bg-gradient-to-r from-[#2D5BFF]/10 via-[#8A5CF6]/10 to-[#FF6B57]/10 border-b border-[#2D5BFF]/20 px-4 py-3 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2D5BFF] text-white shrink-0 shadow-sm shadow-[#2D5BFF]/30">
            <GitCompare className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm">
            <span className="font-semibold font-display text-[var(--ink)] flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#2D5BFF]" />
              {isRtl ? 'روڈ میپ کی ترتیب نو:' : 'Dynamic Roadmap Re-sequenced:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {latestDiff.slice(0, 3).map((item, idx) => {
                const topic = TOPIC_MAP[item.topic_id];
                if (!topic) return null;
                const movedUp = item.to_rank < item.from_rank;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: topic.hue }} />
                    <span>{isRtl ? topic.titleUrdu : topic.title}</span>
                    <span className={`inline-flex items-center font-bold ${movedUp ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {movedUp ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> #{item.to_rank}
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" /> #{item.to_rank}
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="hidden md:inline text-xs text-[var(--muted)] truncate max-w-md">
              {isRtl ? latestDiff[0]?.reasonUrdu : latestDiff[0]?.reason}
            </p>
          </div>
        </div>
        <button
          onClick={dismissDiffBanner}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
