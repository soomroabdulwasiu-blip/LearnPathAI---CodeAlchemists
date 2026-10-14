import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { SEED_CHALLENGES } from '../data/seedData';
import { runPythonCode, TestCase } from '../lib/pythonRunner';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  HelpCircle,
  Sparkles,
  Sliders,
  Code,
  FileCode,
  Check,
  X,
  Cpu,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlaygroundTemplate {
  name: string;
  nameUrdu: string;
  code: string;
  expected?: string;
}

const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    name: 'Print & Calculations',
    nameUrdu: 'پرنٹ اور حساب کتاب',
    code: `# Python 3.12 Free Interactive Playground
# Feel free to edit or write any Python code!
name = "Python Explorer"
score = 42 * 2
print(f"Welcome, {name}!")
print(f"Calculated Score: {score}")
`,
    expected: 'Welcome, Python Explorer!\nCalculated Score: 84',
  },
  {
    name: 'Loops & List Comprehension',
    nameUrdu: 'لوپس اور لسٹ کمپرہینشن',
    code: `# Generate square numbers using list comprehension
numbers = [1, 2, 3, 4, 5, 6, 7, 8]
squares = [n ** 2 for n in numbers]
even_squares = [s for s in squares if s % 2 == 0]
print("Original:", numbers)
print("Squares:", squares)
print("Even Squares:", even_squares)
`,
    expected: '',
  },
  {
    name: 'Dictionaries & Frequency',
    nameUrdu: 'ڈکشنریز اور فریکوئنسی',
    code: `# Word frequency counter
text = "python is simple python is fast python is powerful"
words = text.split()
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
for word, count in sorted(counts.items()):
    print(f"{word}: {count}")
`,
    expected: '',
  },
  {
    name: 'Blank Canvas',
    nameUrdu: 'خالی کینوس',
    code: `# Write your custom Python 3.12 code here
print("Hello World!")
`,
    expected: 'Hello World!',
  },
];

export const CodeLabPage: React.FC = () => {
  const { t, isRtl } = useTranslation();
  const { applyAnswerEvaluation } = useAppStore();
  const [activeTab, setActiveTab] = useState<'playground' | number>('playground');
  const challengeIdx = typeof activeTab === 'number' ? activeTab : 0;
  const challenge = SEED_CHALLENGES[challengeIdx] || SEED_CHALLENGES[0];

  const [code, setCode] = useState<string>(PLAYGROUND_TEMPLATES[0].code);
  const [stdinInput, setStdinInput] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [validateChallengeTests, setValidateChallengeTests] = useState<boolean>(true);
  const [playgroundAssertionMode, setPlaygroundAssertionMode] = useState<'none' | 'custom'>('none');
  const [customAssertionDesc, setCustomAssertionDesc] = useState<string>('Custom Output Check');
  const [customExpectedOutput, setCustomExpectedOutput] = useState<string>('');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stdout, setStdout] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    description: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
  }[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [showHints, setShowHints] = useState<boolean>(false);

  const navigate = useNavigate();
  const [isExplainingAI, setIsExplainingAI] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<{
    summary: string;
    stepByStepExecution: { lineOrBlock: string; description: string; variableState?: string }[];
    expectedOutput: string;
    commonPitfalls: string[];
    providerUsed: string;
  } | null>(null);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);

  useEffect(() => {
    setStdout('');
    setError(null);
    setTestResults([]);
    setExecutionTime(null);
    if (activeTab === 'playground') {
      if (!code.trim()) {
        setCode(PLAYGROUND_TEMPLATES[0].code);
      }
    } else {
      setCode(challenge.starterCode);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, activeTab, validateChallengeTests, playgroundAssertionMode, customExpectedOutput, stdinInput]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setError(null);
    setStdout('');
    setTestResults([]);
    try {
      let testCasesToEvaluate: TestCase[] = [];
      if (activeTab === 'playground') {
        if (playgroundAssertionMode === 'custom' && customExpectedOutput.trim()) {
          testCasesToEvaluate = [
            {
              description: customAssertionDesc.trim() || 'Custom Output Check',
              expectedOutput: customExpectedOutput.trim(),
            },
          ];
        }
      } else {
        if (validateChallengeTests) {
          testCasesToEvaluate = challenge.testCases;
        }
      }

      const res = await runPythonCode(code, testCasesToEvaluate, 4000, stdinInput);
      setStdout(res.stdout);
      if (res.error) {
        setError(res.error);
      }
      setTestResults(res.testResults);
      if (res.executionTimeMs !== undefined) {
        setExecutionTime(res.executionTimeMs);
      }

      if (activeTab !== 'playground' && validateChallengeTests) {
        const allPassed = res.testResults.length > 0 && res.testResults.every((t) => t.passed);
        if (allPassed) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
          applyAnswerEvaluation(challenge.topic_id, true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error executing Python script');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (activeTab === 'playground') {
      setCode(PLAYGROUND_TEMPLATES[0].code);
      setCustomExpectedOutput(PLAYGROUND_TEMPLATES[0].expected || '');
    } else {
      setCode(challenge.starterCode);
    }
    setStdout('');
    setError(null);
    setTestResults([]);
    setExecutionTime(null);
  };

  const handleExplainWithAI = async () => {
    if (!code.trim() || isExplainingAI) return;
    setIsExplainingAI(true);
    setError(null);
    try {
      const res = await api.explainPythonCode(code);
      setAiExplanation(res);
      setShowAIModal(true);
    } catch (err: any) {
      setError(`Failed to generate AI explanation: ${err.message || 'Please try again'}`);
    } finally {
      setIsExplainingAI(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#12C99B]/10 text-[#12C99B] mb-2 border border-[#12C99B]/20">
            <Terminal className="w-3.5 h-3.5 text-[#12C99B]" />
            <span>Python 3.12</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            {t('code_lab_title')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            {t('code_lab_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'playground'
                ? 'bg-[#2D5BFF] text-white shadow-md shadow-[#2D5BFF]/20 scale-[1.02]'
                : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'آزاد پلے گراؤنڈ' : 'Free Playground'}</span>
          </button>
          {SEED_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === idx
                  ? 'bg-[#2D5BFF] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{isRtl ? ch.titleUrdu : ch.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden">
          <div className="p-3 border-b border-[var(--line)] bg-[var(--surface-muted)] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-bold text-[var(--ink)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12C99B]" />
              main.py (Python 3.12)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  showStdin
                    ? 'bg-[#2D5BFF]/10 text-[#2D5BFF] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
                }`}
                title="Input stream (stdin)"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isRtl ? 'ان پٹ' : 'Input (stdin)'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 hover:bg-[var(--surface-hover)] cursor-pointer"
                title="Reset code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Reset</span>
              </button>

              <Button
                size="sm"
                onClick={handleRunCode}
                loading={isRunning}
                className="font-bold shadow-xs bg-[#2D5BFF] hover:bg-[#1E42D9] text-white cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Python</span>
              </Button>

              <Button
                size="sm"
                variant="ai"
                withSparkle={true}
                onClick={handleExplainWithAI}
                loading={isExplainingAI}
                title="Explain code execution with AI"
                className="cursor-pointer"
              >
                <span>Explain with AI</span>
              </Button>
            </div>
          </div>

          {showStdin && (
            <div className="p-2.5 bg-[#080B14] border-b border-[var(--line)] flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--muted)] whitespace-nowrap">
                stdin:
              </span>
              <input
                type="text"
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                placeholder="Enter input values for input() calls..."
                className="flex-1 bg-[#121629] text-sky-200 text-xs font-mono px-2 py-1 rounded border border-white/10 focus:outline-none focus:border-[#2D5BFF]"
              />
            </div>
          )}

          <div className="flex-1 min-h-[380px] p-4 bg-[#0A0D18] text-[#E0E4F4] font-code text-xs sm:text-sm">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full min-h-[360px] bg-transparent resize-none focus:outline-none font-code text-xs sm:text-sm leading-relaxed text-sky-200"
              spellCheck={false}
              placeholder="# Type your Python 3.12 code here..."
            />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="p-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#2D5BFF]" />
                <span>{t('stdout_terminal')}</span>
              </h4>
              <div className="flex items-center gap-2">
                {executionTime !== null && (
                  <span className="text-[10px] text-emerald-500 font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    {executionTime}ms
                  </span>
                )}
                {stdout && !error && (
                  <span className="text-[10px] text-emerald-500 font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Exit 0</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[150px] p-3.5 rounded-2xl bg-[#0C1020] font-code text-xs overflow-y-auto leading-relaxed border border-[var(--line)]">
              {stdout && (
                <div className="text-emerald-400 whitespace-pre-wrap">{stdout}</div>
              )}
              {error && (
                <div className={`text-rose-400 whitespace-pre-wrap ${stdout ? 'mt-3 pt-3 border-t border-rose-500/20' : ''}`}>
                  {error}
                </div>
              )}
              {!stdout && !error && (
                <span className="text-slate-500 italic">
                  {isRtl ? 'پروگرام کا آؤٹ پٹ یہاں ظاہر ہوگا...' : 'Program stdout output will stream here...'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAIModal && aiExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--surface)] border border-[var(--line)] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--line)] bg-[var(--surface-muted)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2D5BFF] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-[var(--ink)]">
                    AI Python Code Breakdown
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Step-by-step memory model and control flow analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-[#2D5BFF]/5 border border-[#2D5BFF]/15 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D5BFF]">
                  High-Level Summary
                </span>
                <p className="text-[var(--ink)] leading-relaxed">{aiExplanation.summary}</p>
              </div>

              {aiExplanation.stepByStepExecution?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Execution Steps
                  </span>
                  {aiExplanation.stepByStepExecution.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] text-xs">
                      <code className="text-[#2D5BFF] font-bold block mb-1">{step.lineOrBlock}</code>
                      <p className="text-[var(--ink)]">{step.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-muted)] flex justify-end">
              <Button size="sm" onClick={() => setShowAIModal(false)} className="cursor-pointer font-bold">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
