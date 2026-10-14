import { AIProviderFactory } from '../factory';
import { StudyPlanRequest, StudyPlanResponse, StudyPlanMilestone, ChatMessage } from '../types';
import { generateRoadmap } from '../../engine/roadmap';
import { TOPIC_MAP } from '../../../lib/constants';

export async function generatePersonalizedStudyPlanService(
  req: StudyPlanRequest
): Promise<StudyPlanResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const masteryMap = req.masteryMap || {};
  const weeklyHours = Math.max(1, Math.min(25, req.weeklyHours || 5));

  const authoritativeRoadmap = generateRoadmap(masteryMap, undefined, weeklyHours);
  const totalWeeks = Math.max(1, Math.ceil(authoritativeRoadmap.personalized_minutes / (weeklyHours * 60)));
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + totalWeeks * 7);
  const targetDate = targetDateObj.toISOString().split('T')[0];

  const activeItems = authoritativeRoadmap.items.filter((i) => i.status !== 'skip').slice(0, 5);
  const milestones: StudyPlanMilestone[] = activeItems.map((item, idx) => {
    const meta = TOPIC_MAP[item.topic_id];
    const score = masteryMap[item.topic_id] ?? 0;
    let microGoals = [
      `Complete interactive lesson on ${meta.title}`,
      `Solve 5 practice problems with >80% accuracy`,
      `Write a practical script in Python Code Lab using ${meta.title}`,
    ];

    if (item.topic_id === 'loops') {
      microGoals = [
        'Practice range(start, stop, step) index calculations',
        'Solve while loop condition termination exercises',
        'Build a nested multiplication table generator in Python Code Lab',
      ];
    } else if (item.topic_id === 'conditionals') {
      microGoals = [
        'Master if-elif-else branching rules',
        'Test nested boolean logic and guard clauses',
        'Debug an edge case with comparison operators',
      ];
    } else if (item.topic_id === 'functions') {
      microGoals = [
        'Understand parameter passing and default arguments',
        'Distinguish local variable scope from global scope',
        'Write modular utility functions with return values',
      ];
    }

    return {
      week: idx + 1,
      focusTopic: item.topic_id,
      topicTitle: meta.title,
      allocatedHours: Number((item.est_minutes / 60).toFixed(1)),
      targetObjective: `Elevate mastery from ${score}% to ≥ 80% (Competent)`,
      dailyMicroGoals: microGoals,
    };
  });

  const prompt = `You are a Python curriculum strategist for LearnPath AI. A student has generated an authoritative study roadmap for Python Fundamentals:
Weekly Study Budget: ${weeklyHours} hours/week
Estimated Duration: ${totalWeeks} weeks (Target Completion: ${targetDate})
Milestone Sequence:
${milestones
  .map(
    (m) =>
      `Week ${m.week}: ${m.topicTitle} (${m.allocatedHours} hrs) - Objective: ${m.targetObjective}`
  )
  .join('\n')}

Generate a concise 2-paragraph personalized strategy summary. Emphasize why following this prerequisite sequence guarantees deep comprehension. Under 180 words.`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an expert curriculum designer. Provide encouraging, concise, actionable study guidance.',
    },
    { role: 'user', content: prompt },
  ];

  let summary = `Your personalized study plan allocates ${weeklyHours} hours per week across ${totalWeeks} weeks to advance from your current knowledge state to Python Fundamentals mastery. By respecting foundational prerequisites, each topic prepares you for advanced data structures and object-oriented principles.`;

  try {
    const rawOutput = await provider.chat(messages, { temperature: 0.3, maxTokens: 350 });
    summary = rawOutput;
  } catch {
    // keep deterministic summary
  }

  return {
    totalWeeks,
    targetDate,
    weeklyHours,
    strategySummary: summary,
    milestones,
    providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Prerequisite Engine',
  };
}
