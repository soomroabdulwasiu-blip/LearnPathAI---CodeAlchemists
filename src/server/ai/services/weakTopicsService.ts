import { AIProviderFactory } from '../factory';
import { ExplainWeakTopicsRequest, ExplainWeakTopicsResponse, WeakTopicAnalysis, ChatMessage } from '../types';
import { TOPICS, TOPIC_MAP } from '../../../lib/constants';
import { TopicId } from '../../../types';

export async function explainWeakTopicsService(
  req: ExplainWeakTopicsRequest
): Promise<ExplainWeakTopicsResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const masteryMap = req.masteryMap || {};

  const sortedTopics = TOPICS.map((t) => ({
    id: t.id,
    title: t.title,
    score: masteryMap[t.id] ?? 0,
    prerequisites: t.prerequisites,
  })).sort((a, b) => a.score - b.score);

  const count = Math.min(sortedTopics.length, req.topWeakestCount || 3);
  const weakest = sortedTopics.slice(0, count);
  const priorityTopic: TopicId = weakest[0]?.id || 'variables';

  const weakAnalyses: WeakTopicAnalysis[] = weakest.map((w) => {
    const unmasteredPrereqs = w.prerequisites.filter((p) => (masteryMap[p] ?? 0) < 50);
    let misconception = `Students often struggle with syntax edge cases and mental execution tracing in ${w.title}.`;
    let action = `Practice 3 focused Python exercises on ${w.title} and trace the code step-by-step.`;

    if (w.id === 'loops') {
      misconception = 'Difficulty predicting loop boundary conditions (off-by-one errors) and variable scope between iterations.';
      action = 'Write down the loop index values on paper for range(start, stop) before running the code.';
    } else if (w.id === 'conditionals') {
      misconception = 'Confusing comparison equality (==) with assignment (=), or short-circuit evaluation in complex boolean expressions.';
      action = 'Break compound boolean conditions into separate test variables with descriptive names.';
    } else if (w.id === 'dictionaries') {
      misconception = 'Attempting to index dictionaries with numeric slices instead of keys, or misunderstanding key immutability.';
      action = 'Use dict.get(key, default) and inspect dictionary keys with .keys().';
    } else if (w.id === 'functions') {
      misconception = 'Confusing local function scope with global variables, or omitting return statements leading to unintended None values.';
      action = 'Explicitly pass variables as parameters and verify the function returns the expected value.';
    }

    return {
      topicId: w.id,
      topicTitle: w.title,
      currentMastery: w.score,
      status: w.score < 35 ? 'Needs Attention' : 'Needs Practice',
      rootCauseMisconception: misconception,
      actionableStep: action,
      prerequisiteGaps: unmasteredPrereqs.map((p) => TOPIC_MAP[p].title),
    };
  });

  const prompt = `You are an expert Python Pedagogy Coach for LearnPath AI. Analyze this student's actual assessment mastery results:
${weakAnalyses
  .map(
    (w) =>
      `- Topic: ${w.topicTitle} (Score: ${w.currentMastery}%, Status: ${w.status}, Prerequisite Gaps: ${
        w.prerequisiteGaps.join(', ') || 'None'
      })`
  )
  .join('\n')}

Provide:
1. A concise, encouraging diagnostic summary of why the student has these specific weaknesses.
2. Direct study advice linking foundational prerequisites to higher-level concepts.
Keep it strictly under 250 words and beginner-friendly.`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an expert Python programming teacher specializing in diagnosing student misconceptions from assessment scores.',
    },
    { role: 'user', content: prompt },
  ];

  try {
    const rawOutput = await provider.chat(messages, { temperature: 0.2, maxTokens: 400 });
    return {
      summary: rawOutput,
      weakTopics: weakAnalyses,
      studyAdvice: `Prioritize ${TOPIC_MAP[priorityTopic].title} first. Strengthen underlying prerequisites to unlock rapid mastery.`,
      priorityTopic,
      providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Engine',
    };
  } catch {
    return {
      summary: `Your assessment identifies **${TOPIC_MAP[priorityTopic].title}** as your highest-leverage growth area. In Python, mastering foundational control flow directly unlocks confidence in data structures and functions.`,
      weakTopics: weakAnalyses,
      studyAdvice: `Dedicate 20 minutes to solve targeted beginner problems on ${TOPIC_MAP[priorityTopic].title}.`,
      priorityTopic,
      providerUsed: 'Deterministic Fallback Engine',
    };
  }
}
