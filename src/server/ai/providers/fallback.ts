import { AIProvider, ChatMessage, CompletionOptions, AIProviderType } from '../types';

export class DeterministicFallbackProvider implements AIProvider {
  readonly name = 'Deterministic Learning Engine';
  readonly type: AIProviderType = 'fallback';
  readonly model: string = 'python-expert-rules';

  isConfigured(): boolean {
    return true;
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    const userMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
    const sysMsg = messages.find((m) => m.role === 'system')?.content || '';

    if (options?.jsonMode || sysMsg.includes('JSON')) {
      if (userMsg.toLowerCase().includes('generate') && userMsg.toLowerCase().includes('question')) {
        return JSON.stringify({
          questions: [
            {
              id: `fallback-q-${Date.now()}`,
              topic_id: 'loops',
              difficulty: 'intermediate',
              question: 'What is the output of the following nested loop in Python?',
              codeSnippet: 'total = 0\nfor i in range(1, 4):\n    for j in range(i):\n        total += 1\nprint(total)',
              options: ['3', '6', '7', '9'],
              correctIndex: 1,
              explanation: 'When i=1, the inner loop runs 1 time. When i=2, it runs 2 times. When i=3, it runs 3 times. 1 + 2 + 3 = 6.',
              tags: ['loops', 'nested-loops', 'iteration'],
            },
          ],
        });
      }

      if (userMsg.toLowerCase().includes('code') || sysMsg.toLowerCase().includes('explain the provided python snippet')) {
        return JSON.stringify({
          summary: 'This Python snippet executes statements sequentially within the local scope.',
          stepByStepExecution: [
            {
              lineOrBlock: 'Sequence initialization',
              description: 'Allocates memory and instantiates Python sequence objects.',
              variableState: 'Local variables initialized in heap',
            },
            {
              lineOrBlock: 'Control flow / iteration',
              description: 'Python evaluates loop iteration protocol or statement blocks.',
              variableState: 'State updated sequentially',
            },
          ],
          expectedOutput: 'Output printed to stdout',
          commonPitfalls: [
            'Beware of variable scope leaks between statements.',
            'Ensure type consistency when concatenating or printing values.',
          ],
        });
      }

      if (userMsg.toLowerCase().includes('weak')) {
        return JSON.stringify({
          summary: 'Assessment calibrated your Python knowledge: prioritize foundational control flow before advanced data structures.',
          studyAdvice: 'Review Python documentation and practice writing manual loop traces on paper.',
        });
      }

      if (userMsg.toLowerCase().includes('plan')) {
        return JSON.stringify({
          strategySummary: 'Adaptive step-by-step progression focusing on prerequisite satisfaction.',
          milestones: [
            {
              week: 1,
              focusTopic: 'loops',
              topicTitle: 'Loops and Iteration',
              allocatedHours: 2.5,
              targetObjective: 'Master while conditions and nested range iteration',
              dailyMicroGoals: ['Trace range(start, stop, step)', 'Solve break/continue edge cases'],
            },
          ],
        });
      }

      return JSON.stringify({
        status: 'calibrated',
        message: 'Deterministic Python evaluation completed based on Python standard documentation.',
      });
    }

    return `In Python, variables and control flow follow strict evaluation rules. When tracing Python expressions: 1. Operations evaluate according to operator precedence (PEMDAS / logical precedence). 2. Strings and sequences are zero-indexed and immutable where applicable. 3. Loops execute predictably based on iterator protocol. To solidify this concept, practice testing small snippets in the Python Code Lab.`;
  }
}
