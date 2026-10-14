import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { RoadmapGraph } from '../components/roadmap/RoadmapGraph';
import { RoadmapTimeline } from '../components/roadmap/RoadmapTimeline';
import { RoadmapWeekly } from '../components/roadmap/RoadmapWeekly';
import { TOPICS, TOPIC_MAP } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import {
  GitBranch,
  ListOrdered,
  Calendar,
  Filter,
  RotateCcw,
  Compass,
  Play,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const RoadmapPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roadmap, masteryMap, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'weekly'>('timeline');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    api.getRoadmap().then(() => {}).catch(() => {});
  }, []);

  const hasScores = Object.values(masteryMap).some((score) => score > 0);
  const hasCompletedDiagnostic = Boolean(user?.hasCompletedDiagnostic || hasScores);

  const overallCompletion = hasCompletedDiagnostic
    ? Math.round(
        (TOPICS.filter((t) => (masteryMap[t.id] ?? 0) >= 80).length / TOPICS.length) * 100
      )
    : 0;
  const remainingHours = Math.round((roadmap?.personalized_minutes || 0) / 60);

  const filteredItems = (roadmap?.items || []).filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.getRoadmap();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      toast.success('Recommendations Refreshed', {
        description: 'Prerequisite sequence updated based on your latest Bayesian performance.',
      });
    } catch {
      toast.info('Recommendations Synchronized');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!hasCompletedDiagnostic || filteredItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#2D5BFF]/10 text-[#2D5BFF] flex items-center justify-center mx-auto shadow-xs">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Your personalized learning path will appear after you complete your diagnostic assessment.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              LearnPath AI evaluates your knowledge across 10 Python Fundamentals modules using Bayesian Knowledge Tracing. Complete the quick diagnostic to generate your prerequisite DAG.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/diagnostic')}
              className="font-bold shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white mr-1.5" />
              <span>Start Diagnostic Quiz</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2D5BFF]/10 text-[#2D5BFF]">
              Python Fundamentals
            </span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-xs text-[var(--muted)] font-medium">Level {user?.level ?? 1} Trajectory</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            My Learning Path
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl">
            Adaptive prerequisite graph calibrated continuously by Bayesian Knowledge Tracing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="p-3 px-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] text-center">
            <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
              Completion
            </span>
            <span className="font-display font-black text-xl text-[#10B981] mt-0.5 block">
              {overallCompletion}%
            </span>
          </div>
          <div className="p-3 px-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] text-center">
            <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
              Remaining
            </span>
            <span className="font-display font-black text-xl text-[#2D5BFF] mt-0.5 block">
              ~{remainingHours} Hours
            </span>
          </div>
          <Button
            size="md"
            variant="secondary"
            onClick={handleRefresh}
            loading={isRefreshing}
            className="font-bold border-[#2D5BFF]/30 text-[#2D5BFF] hover:bg-[#2D5BFF]/10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Refresh Recommendations</span>
          </Button>
        </div>
      </div>

      {filteredItems.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#2D5BFF]/5 via-[#7C3AED]/5 to-[#06B6D4]/5 border border-[#2D5BFF]/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider text-[#2D5BFF]">
            <HelpCircle className="w-4 h-4" />
            <span>Why This Path? (Adaptation Rationale)</span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
            <strong>{TOPIC_MAP[filteredItems[0]?.topic_id]?.title}</strong> is currently ranked #1 on your learning path based on your latest assessment results. Advancing through prerequisite nodes ensures you have solid foundations before unlocking advanced modules.
          </p>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)]">
          {[
            { id: 'timeline' as const, label: 'Vertical Roadmap', icon: ListOrdered },
            { id: 'graph' as const, label: 'Interactive DAG Graph', icon: GitBranch },
            { id: 'weekly' as const, label: 'Weekly Schedule', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer z-10 transition-colors ${
                  isActive ? 'text-[#2D5BFF] font-bold' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="roadmap-view-tab-pill"
                    className="absolute inset-0 rounded-lg bg-[var(--surface)] shadow-xs border border-[var(--line)] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--muted)] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'learn', label: 'Needs Focus' },
            { id: 'practice', label: 'Practice' },
            { id: 'review', label: 'Review' },
            { id: 'skip', label: 'Mastered' },
            { id: 'locked', label: 'Locked' },
          ].map((f) => {
            const isSelected = filterStatus === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`relative px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer z-10 transition-colors ${
                  isSelected ? 'text-white font-bold' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {isSelected ? (
                  <motion.div
                    layoutId="roadmap-filter-pill"
                    className="absolute inset-0 rounded-lg bg-[#2D5BFF] shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                ) : (
                  <div className="absolute inset-0 rounded-lg bg-[var(--surface-muted)] -z-10" />
                )}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {activeTab === 'timeline' && (
            <RoadmapTimeline items={filteredItems} masteryMap={masteryMap} />
          )}
          {activeTab === 'graph' && (
            <RoadmapGraph items={filteredItems} masteryMap={masteryMap} />
          )}
          {activeTab === 'weekly' && (
            <RoadmapWeekly
              items={filteredItems}
              masteryMap={masteryMap}
              weeklyHours={user?.weeklyHours ?? 5}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
