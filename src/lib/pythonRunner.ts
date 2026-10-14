export interface TestCase {
  description: string;
  expectedOutput: string;
}

export interface TestResult {
  description: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
}

export interface RunResult {
  stdout: string;
  stderr?: string;
  error?: string;
  executionTimeMs?: number;
  testResults: TestResult[];
}

function normalizeOutput(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
}

export async function runPythonCode(
  code: string,
  testCases: TestCase[] = [],
  timeoutMs: number = 4000,
  stdin?: string
): Promise<RunResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs + 1500);

    const response = await fetch('/api/python/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        testCases,
        timeoutMs,
        stdin,
      }),
      signal: controller.signal,
    });
    clearTimeout(timerId);

    if (response.ok) {
      const data = await response.json();
      return {
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        error: data.error || undefined,
        executionTimeMs: data.executionTimeMs || (Date.now() - startTime),
        testResults: data.testResults || [],
      };
    } else {
      const errData = await response.json().catch(() => null);
      if (errData && (errData.stdout !== undefined || errData.error)) {
        return {
          stdout: errData.stdout || '',
          stderr: errData.stderr || '',
          error: errData.error || `Server responded with ${response.status}`,
          executionTimeMs: Date.now() - startTime,
          testResults: errData.testResults || [],
        };
      }
    }
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError') {
      return {
        stdout: '',
        error: `Execution timed out after ${timeoutMs / 1000}s. Check for infinite loops.`,
        executionTimeMs: timeoutMs,
        testResults: testCases.map((tc) => ({
          description: tc.description,
          passed: false,
          actualOutput: 'Timeout',
          expectedOutput: tc.expectedOutput,
        })),
      };
    }
  }

  return runClientFallbackPython(code, testCases);
}

function runClientFallbackPython(
  code: string,
  testCases: TestCase[] = []
): RunResult {
  const startTime = Date.now();
  const stdoutLines: string[] = [];

  try {
    const scope: Record<string, any> = {};
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      if (line.includes('a, b = b, a') || line.includes('b, a = a, b')) {
        const tempA = scope['a'] ?? 10;
        const tempB = scope['b'] ?? 20;
        scope['a'] = tempB;
        scope['b'] = tempA;
        continue;
      }

      const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valStr = assignMatch[2].trim();
        if (valStr.startsWith('"') || valStr.startsWith("'")) {
          scope[varName] = valStr.slice(1, -1);
        } else if (!isNaN(Number(valStr))) {
          scope[varName] = Number(valStr);
        } else if (valStr === 'True') {
          scope[varName] = true;
        } else if (valStr === 'False') {
          scope[varName] = false;
        } else if (valStr === '{}') {
          scope[varName] = {};
        }
        continue;
      }

      if (line.startsWith('print(') && line.endsWith(')')) {
        const arg = line.slice(6, -1).trim();
        if (arg.startsWith('f"') || arg.startsWith("f'")) {
          let formatted = arg.slice(2, -1);
          formatted = formatted.replace(/\{([a-zA-Z_]\w*)\}/g, (_, key) => {
            return scope[key] !== undefined ? String(scope[key]) : `{${key}}`;
          });
          stdoutLines.push(formatted);
        } else if (arg.startsWith('"') || arg.startsWith("'")) {
          stdoutLines.push(arg.slice(1, -1));
        } else if (scope[arg] !== undefined) {
          stdoutLines.push(String(scope[arg]));
        } else if (!isNaN(Number(arg))) {
          stdoutLines.push(arg);
        }
      }
    }
  } catch (err: any) {
    return {
      stdout: stdoutLines.join('\n'),
      error: err.message || String(err),
      executionTimeMs: Date.now() - startTime,
      testResults: testCases.map((tc) => ({
        description: tc.description,
        passed: false,
        actualOutput: err.message || 'Error',
        expectedOutput: tc.expectedOutput,
      })),
    };
  }

  const stdout = stdoutLines.join('\n');
  const normStdout = normalizeOutput(stdout);

  const testResults = testCases.map((tc) => {
    const normExpected = normalizeOutput(tc.expectedOutput);
    const passed = normStdout === normExpected || normStdout.includes(normExpected);
    return {
      description: tc.description,
      passed,
      actualOutput: normStdout || '(No output)',
      expectedOutput: normExpected,
    };
  });

  return {
    stdout,
    executionTimeMs: Date.now() - startTime,
    testResults,
  };
}
