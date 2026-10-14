import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  Lightbulb,
  Loader2,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAppStore();

  const suggestedPrompts = [
    'Explain Python loops with simple examples.',
    'How does Python handle memory references for lists?',
    'What is the difference between shallow copy and deep copy?',
    'Explain the LEGB variable scope rule in Python.',
    'How do try-except-finally blocks work in Python?',
  ];

  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    codeSnippet?: string;
    sources?: string[];
    providerUsed?: string;
    timestamp: number;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'assistant',
      text: `Hello ${user?.name ? user.name : 'there'}! I am your LearnPath AI Socratic Assistant. I'm connected to Google Gemini and grounded in official Python documentation.\n\nAsk me any conceptual question about Python, explore edge cases, or ask for step-by-step code traces.`,
      sources: ['Python Language Reference', 'Corbett & Anderson BKT Model'],
      providerUsed: 'Google Gemini (gemini-3.8-flash)',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = (location.state as any)?.initialPrompt;
    if (initial) {
      handleSend(initial);
    }
  }, [location.state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await api.askAITutor({ query: textToSend });
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: res.explanation || res.text,
          sources: res.sources || ['Python Official Documentation'],
          providerUsed: res.providerUsed || 'Google Gemini (gemini-3.8-flash)',
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          text: 'In Python, variables and control flow follow strict evaluation rules. Practice testing this concept in the Python Code Lab to observe output in real time.',
          sources: ['Python Documentation'],
          providerUsed: 'Deterministic Fallback Engine',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'm-reset',
        role: 'assistant',
        text: 'Conversation cleared. How can I help you master Python today?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#2D5BFF] text-white flex items-center justify-center shadow-md shadow-[#7C3AED]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-[var(--ink)]">
              AI Study Assistant
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Socratic conceptual tutoring grounded in official Python documentation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleClear} className="text-xs cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Clear Chat</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[var(--muted)] flex items-center gap-1 pl-1">
          <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
          Suggested Learning Prompts
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[#7C3AED]/50 text-[var(--ink)] whitespace-nowrap transition-all shadow-2xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden flex flex-col h-[560px]">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                    isUser
                      ? 'bg-[#2D5BFF] text-white'
                      : 'bg-gradient-to-tr from-[#7C3AED] to-[#2D5BFF] text-white'
                  }`}
                >
                  {isUser ? (user?.name ? user.name.charAt(0) : 'U') : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-3 ${
                    isUser
                      ? 'bg-[#2D5BFF] text-white rounded-tr-xs shadow-xs'
                      : 'bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.codeSnippet && (
                    <div className="relative p-3.5 rounded-xl bg-[#0A0D18] text-sky-200 font-code text-xs overflow-x-auto border border-[var(--line)]/50 group">
                      <button
                        onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-white flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <pre>{msg.codeSnippet}</pre>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[var(--line)]/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                    {msg.sources && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" /> Grounded in:
                        </span>
                        {msg.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.providerUsed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#2D5BFF]/10 to-[#7C3AED]/10 text-[#2D5BFF] font-semibold border border-[#2D5BFF]/20">
                        <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                        {msg.providerUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] w-fit text-xs text-[var(--muted)] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
              <span>Analyzing Python conceptual syntax and documentation...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-muted)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Python, request code examples, or explore syntax..."
              className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#7C3AED] shadow-2xs"
            />
            <Button
              type="submit"
              size="md"
              disabled={!input.trim() || loading}
              className="h-11 px-5 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#2D5BFF] text-white font-bold shadow-md shadow-[#7C3AED]/25 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
