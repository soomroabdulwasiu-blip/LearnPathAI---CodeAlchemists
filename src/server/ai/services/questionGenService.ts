import { AIProviderFactory } from '../factory';
import { GenerateQuestionsRequest, GenerateQuestionsResponse, ChatMessage } from '../types';
import { extractAndValidateQuestions, validateQuestionSchema } from '../validator';
import { TOPIC_MAP } from '../../../lib/constants';
import { SEED_QUESTIONS } from '../../../data/seedData';
import { Question } from '../../../types';

export async function generatePracticeQuestionsService(
  req: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const topicId = req.topicId || 'loops';
  const difficulty = req.difficulty || 'intermediate';
  const count = Math.min(5, Math.max(1, req.count || 2));
  const topicMeta = TOPIC_MAP[topicId];

  const systemPrompt = `You are a strict, pedagogical Python exam author for LearnPath AI. Generate multiple-choice questions for the topic: "${topicMeta?.title || topicId}". Difficulty: ${difficulty}.
CRITICAL REQUIREMENTS:
1. You MUST respond with a valid JSON array of objects.
2. Each object MUST strictly adhere to this schema:
   {
     "id": "gen-${topicId}-[random]",
     "topic_id": "${topicId}",
     "difficulty": "${difficulty}",
     "question": "Question text in English",
     "codeSnippet": "Python code snippet or empty string",
     "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
     "correctIndex": 0,
     "explanation": "Clear explanation of why this option is correct in Python",
     "tags": ["${topicId}", "${difficulty}", "python"]
   }
3. Exactly 4 options. All options must be plausible and distinct.
4. Verify the Python snippet compiles and runs as claimed.
5. Do NOT include markdown text outside the JSON code block.`;

  const userPrompt = `Generate ${count} high-quality Python multiple-choice questions for topic "${topicMeta?.title || topicId}" at ${difficulty} difficulty. Output raw JSON array only.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let validatedQuestions: Question[] = [];
  try {
    const rawOutput = await provider.chat(messages, {
      temperature: 0.2,
      maxTokens: 1200,
      jsonMode: true,
    });
    validatedQuestions = extractAndValidateQuestions(rawOutput, topicId);
  } catch {
    // handled via fallback
  }

  if (validatedQuestions.length === 0) {
    const seeds = SEED_QUESTIONS.filter((q) => q.topic_id === topicId);
    const selected = seeds.length > 0 ? seeds.slice(0, count) : [SEED_QUESTIONS[0]];
    validatedQuestions = selected.map((q) => {
      const copy = { ...q, id: `seed-gen-${q.id}-${Date.now()}` };
      const val = validateQuestionSchema(copy, topicId);
      return val.isValid && val.question ? val.question : q;
    });
  }

  return {
    topicId,
    difficulty,
    questions: validatedQuestions,
    validationPassed: validatedQuestions.length > 0,
    providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Seed Bank',
  };
}
