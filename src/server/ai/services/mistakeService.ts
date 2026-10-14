import { AIProviderFactory } from '../factory';
import { ExplainMistakeRequest, ExplainMistakeResponse, ChatMessage } from '../types';
import { db } from '../../db/store';
import { TOPIC_MAP } from '../../../lib/constants';

export async function explainMistakeService(
  req: ExplainMistakeRequest
): Promise<ExplainMistakeResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const question = db.getQuestion(req.questionId);
  if (!question) {
    return {
      questionId: req.questionId,
      questionText: 'Unknown question',
      selectedOptionText: 'Selected option',
      correctOptionText: 'Correct option',
      misconceptionAnalysis: 'The question ID was not found in the question bank.',
      stepByStepTrace: 'Verify the question ID and try again.',
      correctApproach: 'Review Python syntax fundamentals.',
      providerUsed: 'Deterministic Fallback Engine',
    };
  }

  const selectedIdx = Math.max(0, Math.min(question.options.length - 1, req.selectedOptionIndex));
  const selectedText = question.options[selectedIdx] || 'Option';
  const correctText = question.options[question.correctIndex] || 'Option';
  const topicMeta = TOPIC_MAP[question.topic_id];

  const systemPrompt = `You are a patient, expert Python educator for LearnPath AI. A student selected an INCORRECT option on a Python Fundamentals question.
Your task is to:
1. Identify the exact misconception that leads a student to choose this incorrect answer.
2. Provide a step-by-step trace showing what Python actually does versus what the student thought Python does.
3. Show the correct mental model and how to solve similar problems correctly.
Tone: Encouraging, analytical, and grounded in Python semantics. Under 250 words.`;

  const userPrompt = `Topic: ${topicMeta?.title || question.topic_id}
Question: ${question.question}
${question.codeSnippet ? `Code Snippet:\n\`\`\`python\n${question.codeSnippet}\n\`\`\`\n` : ''}
Student's Chosen (INCORRECT) Answer: "${selectedText}" (Option #${selectedIdx + 1})
Actual CORRECT Answer: "${correctText}" (Option #${question.correctIndex + 1})
Authoritative Explanation: "${question.explanation}"
Please explain why the student made this mistake and how to adopt the correct approach.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const rawOutput = await provider.chat(messages, { temperature: 0.2, maxTokens: 500 });
    return {
      questionId: question.id,
      questionText: question.question,
      selectedOptionText: selectedText,
      correctOptionText: correctText,
      misconceptionAnalysis: rawOutput,
      stepByStepTrace: `Python evaluates this expression in order. Choosing "${selectedText}" typically happens when overlooking language type casting or precedence rules.`,
      correctApproach: question.explanation,
      providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Engine',
    };
  } catch {
    return {
      questionId: question.id,
      questionText: question.question,
      selectedOptionText: selectedText,
      correctOptionText: correctText,
      misconceptionAnalysis: `You chose **"${selectedText}"**, while the correct answer is **"${correctText}"**.\n\nIn Python, ${question.explanation}`,
      stepByStepTrace: `1. Check the data types of variables involved.\n2. Apply Python operation rules.\n3. Verify the final result is "${correctText}".`,
      correctApproach: question.explanation,
      providerUsed: 'Deterministic Fallback Engine',
    };
  }
}
