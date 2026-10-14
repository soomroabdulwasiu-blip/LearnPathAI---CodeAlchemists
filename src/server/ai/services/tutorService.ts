import { AIProviderFactory } from '../factory';
import { ExplainConceptRequest, ExplainConceptResponse, ChatMessage } from '../types';
import { sanitizeUserInput } from '../validator';
import { TOPIC_MAP } from '../../../lib/constants';

export async function explainConceptService(
  req: ExplainConceptRequest
): Promise<ExplainConceptResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const query = sanitizeUserInput(req.userQuery, 500);
  const topicMeta = req.topicId ? TOPIC_MAP[req.topicId] : undefined;
  const topicName = topicMeta ? topicMeta.title : 'Python Fundamentals';

  const systemPrompt = `You are the expert, encouraging AI Python Tutor for LearnPath AI. Your sole mission is teaching Python Fundamentals to beginner students.
Guidelines:
1. Explain concepts in simple, clear, intuitive language. Avoid confusing jargon without explaining it first.
2. Use real-world analogies (e.g. variables are labeled boxes, lists are grocery lists).
3. Provide one clean, minimal Python code snippet illustrating the concept.
4. Emphasize why Python behaves the way it does.
5. Provide 2 suggested follow-up questions for the student.
Format your answer with clear markdown headings and bullet points.`;

  const userPrompt = `Topic: ${topicName}
${req.contextCode ? `Context Code:\n\`\`\`python\n${req.contextCode}\n\`\`\`\n` : ''}
Student Question: ${query || 'Please explain the core foundational concepts of this topic with examples.'}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const rawOutput = await provider.chat(messages, { temperature: 0.3, maxTokens: 800 });
    return {
      explanation: rawOutput,
      keyTakeaway: `Mastering ${topicName} is essential for writing idiomatic, robust Python code.`,
      suggestedFollowUps: [
        `What happens if I test an edge case with ${topicName}?`,
        `How does Python store this in memory under the hood?`,
      ],
      sources: ['Python Reference Manual', 'The Official Python Tutorial (docs.python.org)'],
      providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Engine',
    };
  } catch {
    return {
      explanation: `Here is the conceptual breakdown for **${topicName}** in Python:\n\n### Core Concept\nIn Python, ${topicMeta ? topicMeta.description : 'code execution follows predictable evaluation rules'}.\n\n### Example\n\`\`\`python\n# Python Demonstration\nitems = [1, 2, 3]\nprint(f"Items processed: {len(items)}")\n\`\`\`\n\n### Why It Matters\nWriting clear, readable Python code prevents subtle bugs and ensures proper resource management.`,
      keyTakeaway: `Focus on variable types and indentation semantics in Python.`,
      suggestedFollowUps: [
        'How do I test this in Python Code Lab?',
        'What are common beginner errors in this topic?',
      ],
      sources: ['Python Standard Documentation'],
      providerUsed: 'Deterministic Fallback Engine',
    };
  }
}
