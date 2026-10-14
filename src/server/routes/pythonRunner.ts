import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';

export const pythonRouter = Router();

interface TestCaseInput {
  description: string;
  expectedOutput: string;
}

interface TestResultOutput {
  description: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
}

function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
}

function evaluateTestCases(
  stdout: string,
  testCases: TestCaseInput[] = []
): TestResultOutput[] {
  const normStdout = normalizeOutput(stdout);

  return testCases.map((tc) => {
    const normExpected = normalizeOutput(tc.expectedOutput || '');
    let passed = normStdout === normExpected;
    if (!passed && normExpected.length > 0) {
      passed = normStdout.includes(normExpected);
    }
    if (!passed && normExpected.includes('\n')) {
      const cleanExpected = normExpected.replace(/\s+/g, ' ');
      const cleanStdout = normStdout.replace(/\s+/g, ' ');
      passed = cleanStdout.includes(cleanExpected);
    }
    return {
      description: tc.description,
      passed,
      actualOutput: normStdout || '(No output)',
      expectedOutput: normExpected,
    };
  });
}

pythonRouter.post('/run', (req: Request, res: Response) => {
  const { code, testCases = [], timeoutMs = 4000 } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({
      error: 'Code parameter must be a string',
      stdout: '',
      testResults: [],
    });
  }

  if (code.length > 64 * 1024) {
    return res.status(400).json({
      error: 'Code payload exceeds maximum size limit (64KB).',
      stdout: '',
      testResults: [],
    });
  }

  const startTime = Date.now();
  const maxTimeout = Math.min(Math.max(timeoutMs, 1000), 10000);
  const maxBufferBytes = 128 * 1024;
  let stdout = '';
  let stderr = '';
  let isFinished = false;

  const isolatedEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    PYTHONUNBUFFERED: '1',
    PYTHONDONTWRITEBYTECODE: '1',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
  };

  const child = spawn('python3', ['-u', '-c', code], {
    env: isolatedEnv,
    cwd: '/tmp',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const timer = setTimeout(() => {
    if (!isFinished) {
      isFinished = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
      const testResults = evaluateTestCases(stdout, testCases);
      return res.json({
        stdout,
        stderr: '',
        error: `Execution timed out after ${maxTimeout / 1000}s. Check for infinite loops or long-running computations.`,
        executionTimeMs: Date.now() - startTime,
        testResults,
      });
    }
  }, maxTimeout);

  child.stdout.on('data', (chunk: Buffer) => {
    if (stdout.length + chunk.length <= maxBufferBytes) {
      stdout += chunk.toString('utf8');
    } else if (stdout.length < maxBufferBytes) {
      stdout += chunk.toString('utf8').slice(0, maxBufferBytes - stdout.length);
      stdout += '\n[Output truncated: maximum 128KB limit reached]';
    }
  });

  child.stderr.on('data', (chunk: Buffer) => {
    if (stderr.length + chunk.length <= maxBufferBytes) {
      stderr += chunk.toString('utf8');
    } else if (stderr.length < maxBufferBytes) {
      stderr += chunk.toString('utf8').slice(0, maxBufferBytes - stderr.length);
      stderr += '\n[Error output truncated]';
    }
  });

  child.on('error', (err) => {
    if (isFinished) return;
    isFinished = true;
    clearTimeout(timer);
    return res.status(500).json({
      stdout: '',
      stderr: '',
      error: `Failed to launch Python engine: ${err.message}`,
      executionTimeMs: Date.now() - startTime,
      testResults: (testCases || []).map((tc: TestCaseInput) => ({
        description: tc.description,
        passed: false,
        actualOutput: 'Process execution error',
        expectedOutput: tc.expectedOutput,
      })),
    });
  });

  child.on('close', (codeStatus) => {
    if (isFinished) return;
    isFinished = true;
    clearTimeout(timer);
    const executionTimeMs = Date.now() - startTime;
    const testResults = evaluateTestCases(stdout, testCases);
    let error: string | null = null;
    if (codeStatus !== 0 && stderr) {
      error = stderr.trim();
    } else if (codeStatus !== 0) {
      error = `Process exited with code ${codeStatus}`;
    }
    return res.json({
      stdout: stdout.trimEnd(),
      stderr: stderr.trimEnd(),
      error,
      executionTimeMs,
      testResults,
    });
  });

  try {
    const { stdin = '' } = req.body;
    child.stdin.write(stdin ? `${stdin}\n` : '\n', 'utf8', () => {
      child.stdin.end();
    });
  } catch {
    try {
      child.stdin.end();
    } catch {
      // ignore
    }
  }
});
