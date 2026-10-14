import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RoadmapItem, TopicId } from '../../types';
import { TOPIC_MAP, getMasteryLevel } from '../../lib/constants';
import { useTranslation } from '../../i18n';
import { Calendar, Clock, Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface RoadmapWeeklyProps {
  items: RoadmapItem[];
  masteryMap: Record<TopicId, number>;
  weeklyHours: number;
}

export const RoadmapWeekly: React.FC<RoadmapWeeklyProps> = ({ items, masteryMap, weeklyHours }) => {
  const { isRtl } = useTranslation();
  const navigate = useNavigate();

  const weeksMap: Record<number, RoadmapItem[]> = {};
  items.forEach((item) => {
    if (!weeksMap[item.week]) weeksMap[item.week] = [];
    weeksMap[item.week].push(item);
  });

  const weekNumbers = Object.keys(weeksMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {weekNumbers.map((weekNum) => {
        const weekItems = weeksMap[weekNum];
        const totalMinutes = weekItems.reduce((acc, i) => acc + i.est_minutes, 0);

        return (
          <div key={weekNum} className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2D5BFF]/15 text-[#2D5BFF] flex items-center justify-center font-bold text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  {isRtl ? `ہفتہ ${weekNum}` : `Week ${weekNum}`}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Clock className="w-3.5 h-3.5 text-[#2D5BFF]" />
                <span className="font-semibold text-[var(--ink)]">{Math.round((totalMinutes / 60) * 10) / 10}h</span>
                <span>/ {weeklyHours}h target</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weekItems.map((item) => {
                const meta = TOPIC_MAP[item.topic_id];
                if (!meta) return null;
                const score = masteryMap[item.topic_id] ?? 0;
                const tier = getMasteryLevel(score);

                return (
                  <div
                    key={item.topic_id}
                    className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] flex items-center justify-between gap-3 hover:border-[#2D5BFF]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.hue }} />
                      <div>
                        <h4 className="font-display font-semibold text-xs text-[var(--ink)]">
                          {isRtl ? meta.titleUrdu : meta.title}
                        </h4>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm border ${tier.badgeBg}`}>
                          {score}% • {isRtl ? tier.labelUrdu : tier.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--muted)]">{item.est_minutes}m</span>
                      {item.status !== 'locked' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/practice?topic=${item.topic_id}`)}
                          className="h-7 w-7 p-0 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-[#2D5BFF] fill-[#2D5BFF]" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
