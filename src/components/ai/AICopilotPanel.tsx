import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import {
  Sparkles,
  GitBranch,
  HelpCircle,
  PlayCircle,
  MessageSquare,
  RefreshCw,
  Loader2,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { TopicId } from '../../types';

export const AICopilotPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, masteryMap } = useAppStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<{
    provider: string;
    model: string;
    status: string;
    isConfigured: boolean;
  }>({
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    status: 'active',
    isConfigured: true,
  });

  useEffect(() => {
    let mounted = true;
    api.getAIStatus().then((st) => {
      if (mounted && st) {
        setProviderStatus({
          provider: st.provider,
          model: st.model,
          status: st.status,
          isConfigured: st.isConfigured,
        });
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const hasAssessed = Boolean(user?.hasCompletedDiagnostic || Object.values(masteryMap).some((v) => v > 0));
  const assessedEntries = Object.entries(masteryMap).filter(([, score]) => score > 0);
  const weakestTopicId =
    (assessedEntries.sort(([, a], [, b]) => a - b)[0]?.[0] as TopicId) || 'variables';

  const handleGeneratePlan = async () => {
    if (!hasAssessed) {
      toast.info('Diagnostic Required', {
        description: 'Complete your diagnostic assessment first to generate a personalized study plan.',
      });
      navigate('/diagnostic');
      return;
    }
    if (loadingAction) return;
    setLoadingAction('plan');
    try {
      const plan = await api.getPersonalizedStudyPlan(masteryMap, user?.weeklyHours || 5);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      toast.success('AI Personalized Study Plan Calibrated', {
        description: `${plan.totalWeeks} weeks target (${plan.weeklyHours} hrs/wk).`,
        duration: 5000,
      });
      navigate('/roadmap');
    } catch {
      toast.error('Failed to generate study plan');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExplainWeak = async () => {
    if (!hasAssessed) {
      toast.info('Diagnostic Required', {
        description: 'Complete your diagnostic assessment first so we can identify your areas for improvement.',
      });
      navigate('/diagnostic');
      return;
    }
    if (loadingAction) return;
    setLoadingAction('explain');
    try {
      const res = await api.explainWeakTopics(masteryMap, 3);
      toast.info('Weak Topics Diagnostic Analysis', {
        description: res.summary.slice(0, 110) + '...',
        duration: 6000,
      });
      navigate('/assistant', {
        state: {
          initialPrompt: `Explain why I struggle with ${weakestTopicId} and provide simple conceptual rules with Python snippets.`,
        },
      });
    } catch {
      navigate('/assistant');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateQuestions = async () => {
    if (loadingAction) return;
    setLoadingAction('questions');
    try {
      const res = await api.generatePracticeQuestions(weakestTopicId, 'intermediate', 2);
      toast.success('Generated Targeted Python Practice Set', {
        description: `Created ${res.questions.length} validated questions for ${weakestTopicId.toUpperCase()}.`,
        duration: 4500,
      });
      navigate(`/practice?topic=${weakestTopicId}`);
    } catch {
      navigate(`/practice?topic=${weakestTopicId}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAskTutor = async () => {
    navigate('/assistant');
  };

  const handleRefreshRecommendations = async () => {
    if (!hasAssessed) {
      toast.info('Diagnostic Required', {
        description: 'Take the diagnostic assessment to establish your learning roadmap baseline.',
      });
      navigate('/diagnostic');
      return;
    }
    if (loadingAction) return;
    setLoadingAction('refresh');
    try {
      const rm = await api.getRoadmap();
      toast.success('Recommendations Refreshed', {
        description: `Prerequisite DAG re-calibrated. Top target: #${rm.items[0]?.rank || 1} ${rm.items[0]?.topic_id}.`,
      });
    } catch {
      toast.success('Recommendations Refreshed');
    } finally {
      setLoadingAction(null);
    }
  };

  const aiActions = [
    {
      id: 'plan',
      label: 'Generate My Learning Plan',
      icon: GitBranch,
      color: '#2D5BFF',
      handler: handleGeneratePlan,
    },
    {
      id: 'explain',
      label: 'Explain My Weak Topics',
      icon: HelpCircle,
      color: '#7C3AED',
      handler: handleExplainWeak,
    },
    {
      id: 'questions',
      label: 'Create Practice Questions',
      icon: PlayCircle,
      color: '#06B6D4',
      handler: handleCreateQuestions,
    },
    {
      id: 'tutor',
      label: 'Ask AI Tutor',
      icon: MessageSquare,
      color: '#10B981',
      handler: handleAskTutor,
    },
    {
      id: 'refresh',
      label: 'Refresh Recommendations',
      icon: RefreshCw,
      color: '#F59E0B',
      handler: handleRefreshRecommendations,
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2D5BFF]/10 via-[#7C3AED]/10 to-[#06B6D4]/10 border border-[#7C3AED]/30 shadow-[var(--shadow-md)] relative overflow-hidden space-y-5 transition-all duration-300 hover:shadow-[var(--shadow-lg)]">
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#7C3AED]/20 to-[#2D5BFF]/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#2D5BFF] text-white flex items-center justify-center shadow-md shadow-[#7C3AED]/30 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-[var(--ink)] leading-snug">
              AI Learning Copilot
            </h3>
            <span className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-semibold flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              <span>
                {providerStatus.isConfigured
                  ? `${providerStatus.provider.toUpperCase()} (${providerStatus.model})`
                  : 'Deterministic Engine (Python Rules)'}
              </span>
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            providerStatus.isConfigured
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}
        >
          {providerStatus.isConfigured ? 'Live AI' : 'Deterministic'}
        </span>
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed relative z-10">
        Personalized Python Fundamentals learning intelligence. Analyze real growth areas, generate targeted practice, and adapt your study trajectory.
      </p>

      <div className="space-y-2.5 relative z-10">
        {aiActions.map((action) => {
          const Icon = action.icon;
          const isLoading = loadingAction === action.id;
          return (
            <button
              key={action.id}
              onClick={action.handler}
              disabled={Boolean(loadingAction)}
              className="w-full p-3 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[#7C3AED]/60 text-left text-xs font-semibold text-[var(--ink)] transition-all duration-200 flex items-center justify-between shadow-xs hover:shadow-md hover:shadow-[#7C3AED]/15 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group relative overflow-hidden disabled:opacity-60 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-2.5 relative z-1">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: `${action.color}15`,
                    color: action.color,
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#7C3AED] group-hover:rotate-12 transition-transform shrink-0" />
                  <span>{action.label}</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all relative z-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
