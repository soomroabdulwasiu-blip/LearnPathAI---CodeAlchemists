import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useNavigate } from 'react-router-dom';
import { TopicId, MasteryStatus } from '../../types';
import { TOPIC_MAP, getMasteryLevel } from '../../lib/constants';
import { ProgressRing } from '../ui/ProgressRing';
import { useTranslation } from '../../i18n';
import { Lock, CheckCircle2, HelpCircle, ArrowUpRight, ArrowDownRight, Play } from 'lucide-react';

interface NodeData {
  topicId: TopicId;
  mastery: number;
  status: MasteryStatus;
  rank: number;
  previousRank?: number;
  why: string;
  whyUrdu: string;
  estMinutes: number;
  week: number;
}

export const RoadmapNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const { topicId, mastery, status, rank, previousRank, why, whyUrdu, estMinutes } = data;
  const meta = TOPIC_MAP[topicId];
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const [showWhy, setShowWhy] = useState(false);

  if (!meta) return null;

  const isLocked = status === 'locked';
  const isMastered = status === 'skip';
  const masteryTier = getMasteryLevel(mastery);
  const movedUp = previousRank !== undefined && rank < previousRank;
  const movedDown = previousRank !== undefined && rank > previousRank;

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#2D5BFF] !border-none opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#2D5BFF] !border-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div
        className={`w-64 rounded-2xl p-4 border transition-all duration-300 shadow-[var(--shadow-md)] bg-[var(--surface)] ${
          isLocked
            ? 'opacity-60 border-[var(--line)] bg-[var(--surface-muted)] cursor-not-allowed'
            : 'border-[var(--line)] hover:border-[#2D5BFF] hover:shadow-[var(--shadow-lg)] cursor-pointer'
        }`}
        onClick={() => {
          if (!isLocked) navigate(`/topics/${topicId}`);
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-lg text-white font-display font-extrabold text-xs flex items-center justify-center shadow-xs"
              style={{ backgroundColor: meta.hue }}
            >
              #{rank}
            </span>
            {movedUp && (
              <span className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> +{previousRank! - rank}
              </span>
            )}
            {movedDown && (
              <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                <ArrowDownRight className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isLocked ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded-full border border-[var(--line)]">
                <Lock className="w-2.5 h-2.5" />
                {t('status_locked')}
              </span>
            ) : isMastered ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {t('status_skip')}
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${masteryTier.badgeBg}`}>
                {isRtl ? masteryTier.labelUrdu : masteryTier.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 my-2">
          <div className="flex-1">
            <h4 className="font-display font-bold text-sm text-[var(--ink)] leading-snug group-hover:text-[#2D5BFF] transition-colors">
              {isRtl ? meta.titleUrdu : meta.title}
            </h4>
            <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
              {isRtl ? meta.descriptionUrdu : meta.description}
            </p>
          </div>
          <ProgressRing progress={mastery} size={44} strokeWidth={4} color={meta.hue} />
        </div>

        <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span>{estMinutes} {t('minutes')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowWhy(!showWhy);
            }}
            className="flex items-center gap-1 text-[10px] font-semibold text-[#2D5BFF] hover:underline cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t('why_this_next')}
          </button>
        </div>
      </div>

      {showWhy && (
        <div
          className={`absolute z-50 bottom-full mb-2 w-72 p-3 rounded-2xl bg-[var(--surface)] border border-[#2D5BFF]/30 shadow-[var(--shadow-lg)] text-xs text-[var(--ink)] animate-in fade-in zoom-in-95 duration-150 ${
            isRtl ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--line)]">
            <span className="font-bold font-display text-[11px] uppercase tracking-wider text-[#2D5BFF]">
              {isRtl ? 'ترجیح کی وجہ' : 'Why Adaptive Priority #' + rank}
            </span>
            <button
              onClick={() => setShowWhy(false)}
              className="text-[var(--muted)] hover:text-[var(--ink)] text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {isRtl ? whyUrdu : why}
          </p>
          {!isLocked && (
            <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex items-center justify-end gap-2">
              <button
                onClick={() => navigate(`/practice?topic=${topicId}`)}
                className="text-[10px] font-bold text-white bg-[#2D5BFF] px-2.5 py-1 rounded-lg hover:bg-[#204AE0] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-white" />
                {t('start_practice')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
