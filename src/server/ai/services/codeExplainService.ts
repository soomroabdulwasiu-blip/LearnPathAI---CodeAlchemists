import { AIProviderFactory } from '../factory';
import { ExplainCodeRequest, ExplainCodeResponse, ChatMessage } from '../types';
import { sanitizeUserInput } from '../validator';

export async function explainPythonCodeService(
  req: ExplainCodeRequest
): Promise<ExplainCodeResponse> {
  const { provider, status } = AIProviderFactory.getProvider();
  const code = sanitizeUserInput(req.code, 1500);

  if (!code) {
    return {
      summary: 'No Python code snippet provided.',
      stepByStepExecution: [],
      expectedOutput: 'None',
      commonPitfalls: ['Ensure code is provided before requesting an explanation.'],
      providerUsed: 'Deterministic Fallback Engine',
    };
  }

  const systemPrompt = `You are an expert Python interpreter and educator for LearnPath AI.
Explain the provided Python snippet step-by-step for a beginner.
You MUST output valid JSON conforming to this schema:
{
  "summary": "1-2 sentence high-level summary of what the code does",
  "stepByStepExecution": [
    {
      "lineOrBlock": "code line or expression",
      "description": "what happens in memory / control flow",
      "variableState": "e.g. x = 5, total = 0"
    }
  ],
  "expectedOutput": "expected console stdout",
  "commonPitfalls": ["pitfall 1", "pitfall 2"]
}
Only output the JSON object. No extraneous text.`;

  const userPrompt = `Explain this Python code:\n\`\`\`python\n${code}\n\`\`\``;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const rawOutput = await provider.chat(messages, {
      temperature: 0.1,
      maxTokens: 1500,
      jsonMode: true,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      const match = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        const objMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error('Unable to parse JSON from AI response');
        }
      }
    }

    const steps =
      Array.isArray(parsed.stepByStepExecution) && parsed.stepByStepExecution.length > 0
        ? parsed.stepByStepExecution
        : code
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .map((line, idx) => ({
              lineOrBlock: line.trim(),
              description: `Step ${idx + 1}: Python evaluates statement '${line.trim()}' sequentially.`,
              variableState: `Variables updated in step ${idx + 1}`,
            }));

    return {
      summary: parsed.summary || 'Python snippet execution breakdown',
      stepByStepExecution: steps,
      expectedOutput: parsed.expectedOutput || 'Output produced sequentially according to print statements',
      commonPitfalls:
        Array.isArray(parsed.commonPitfalls) && parsed.commonPitfalls.length > 0
          ? parsed.commonPitfalls
          : ['Check variable scoping and types', 'Beware of indentation errors'],
      providerUsed: status.isConfigured ? `${provider.name} (${provider.model})` : 'Deterministic Engine',
    };
  } catch {
    const lines = code.split('\n').filter((l) => l.trim().length > 0);
    const steps = lines.map((line, idx) => ({
      lineOrBlock: line.trim(),
      description: `Step ${idx + 1}: Python evaluates statement '${line.trim()}' sequentially according to standard syntax rules.`,
      variableState: `Variables updated during step ${idx + 1}`,
    }));

    return {
      summary: 'This Python snippet executes statements sequentially in the current module scope.',
      stepByStepExecution: steps,
      expectedOutput: 'Standard output printed to console upon execution.',
      commonPitfalls: [
        'Ensure variable names match Python 3 identifier rules.',
        'Beware of type mismatch between strings and numerical types.',
      ],
      providerUsed: 'Deterministic Fallback Engine',
    };
  }
}
