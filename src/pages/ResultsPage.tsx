import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { TOPICS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const { masteryMap, roadmap } = useAppStore();

  const radarData = TOPICS.map((topic) => ({
    subject: topic.title.split(' ')[0],
    score: masteryMap[topic.id] ?? 0,
    fullMark: 100,
  }));

  const sortedTopics = [...TOPICS].sort(
    (a, b) => (masteryMap[b.id] ?? 0) - (masteryMap[a.id] ?? 0)
  );
  const topStrengths = sortedTopics.slice(0, 3);
  const topWeaknesses = sortedTopics.slice(-3).reverse();

  const standardHours = Math.round((roadmap?.standard_minutes || 480) / 60);
  const personalizedHours = Math.round((roadmap?.personalized_minutes || 320) / 60);
  const hoursSaved = Math.max(1, standardHours - personalizedHours);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12C99B]/15 text-[#12C99B] text-xs font-bold border border-[#12C99B]/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Diagnostic Calibration Completed</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[var(--ink)]">
          {t('results_title')}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {t('results_subtitle')}
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#2D5BFF]/10 via-[#8A5CF6]/10 to-[#12C99B]/10 border border-[#2D5BFF]/25 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)]">
            Standard Curriculum
          </span>
          <div className="font-display font-extrabold text-3xl text-[var(--ink)] mt-1">
            {standardHours} {t('hours')}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Linear one-size-fits-all curriculum</span>
        </div>
        <div>
          <span className="text-xs font-bold font-display uppercase tracking-wider text-[#2D5BFF]">
            LearnPath Adaptive Path
          </span>
          <div className="font-display font-extrabold text-3xl text-[#2D5BFF] mt-1">
            {personalizedHours} {t('hours')}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Targeted foundational DAG focus</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Estimated Time Saved</span>
          </div>
          <div className="font-display font-black text-3xl text-emerald-600 dark:text-emerald-400 mt-1">
            {hoursSaved} {t('hours')}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Bypassing unnecessary beginner review</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[var(--ink)]">
              Conceptual Competency Radar
            </h3>
            <span className="text-xs text-[var(--muted)]">10 Core Dimensions</span>
          </div>
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="var(--line)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--ink)', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--line)" />
                <Radar
                  name="Mastery"
                  dataKey="score"
                  stroke="#2D5BFF"
                  fill="#2D5BFF"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] space-y-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                {t('top_strengths')}
              </h3>
            </div>
            <div className="space-y-3">
              {topStrengths.map((topic) => {
                const score = masteryMap[topic.id] ?? 0;
                return (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topic.hue }} />
                      <span className="font-display font-semibold text-xs text-[var(--ink)]">
                        {isRtl ? topic.titleUrdu : topic.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[var(--line)] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--ink)]">{score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] space-y-4">
            <div className="flex items-center gap-2 text-[#FF6B57]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                {t('priority_growth')}
              </h3>
            </div>
            <div className="space-y-3">
              {topWeaknesses.map((topic) => {
                const score = masteryMap[topic.id] ?? 0;
                return (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topic.hue }} />
                      <span className="font-display font-semibold text-xs text-[var(--ink)]">
                        {isRtl ? topic.titleUrdu : topic.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[var(--line)] overflow-hidden">
                        <div
                          className="h-full bg-[#FF6B57] rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--ink)]">{score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[#2D5BFF]/30 shadow-[var(--shadow-md)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display font-extrabold text-xl text-[var(--ink)]">
            Your personalized learning roadmap is calibrated.
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            Foundational gaps have been prioritized in your prerequisite DAG.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate('/roadmap')}
          className="shrink-0 font-bold shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
        >
          <GitBranch className="w-4 h-4 mr-1.5" />
          <span>{t('explore_roadmap_cta')}</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};
