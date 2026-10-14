import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { SEED_QUESTIONS } from '../data/seedData';
import { TOPICS, TOPIC_MAP } from '../lib/constants';
import { Question, TopicId } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  Plus,
  Trash2,
  X,
  Eye,
} from 'lucide-react';

export const InstructorContentPage: React.FC = () => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const [formTopic, setFormTopic] = useState<TopicId>('variables');
  const [formDifficulty, setFormDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [formQuestion, setFormQuestion] = useState('');
  const [formSnippet, setFormSnippet] = useState('');
  const [formOptions, setFormOptions] = useState(['Option A', 'Option B', 'Option C', 'Option D']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.explanation.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = topicFilter === 'all' || q.topic_id === topicFilter;
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  const handleOpenAdd = () => {
    setFormTopic('variables');
    setFormDifficulty('beginner');
    setFormQuestion('');
    setFormSnippet('');
    setFormOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setFormCorrectIndex(0);
    setFormExplanation('');
    setShowModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) return;
    const newQ: Question = {
      id: `q-custom-${Date.now()}`,
      topic_id: formTopic,
      difficulty: formDifficulty,
      question: formQuestion,
      codeSnippet: formSnippet || undefined,
      options: formOptions,
      correctIndex: formCorrectIndex,
      explanation: formExplanation,
    };
    setQuestions([newQ, ...questions]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            {t('content_title')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Manage the adaptive assessment question bank, edit difficulty ratings, and preview student experience.
          </p>
        </div>
        <Button size="md" onClick={handleOpenAdd} className="font-bold cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t('add_question')}</span>
        </Button>
      </div>

      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
            />
          </div>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none"
          >
            <option value="all">All Topics (10)</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <span className="text-xs text-[var(--muted)] font-mono">
          Showing {filteredQuestions.length} of {questions.length} questions
        </span>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--muted)] font-display uppercase tracking-wider text-[10px]">
              <th className="p-3 font-bold">Topic</th>
              <th className="p-3 font-bold">Difficulty</th>
              <th className="p-3 font-bold">Question Prompt</th>
              <th className="p-3 font-bold">Correct Answer</th>
              <th className="p-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => {
              const meta = TOPIC_MAP[q.topic_id];
              return (
                <tr
                  key={q.id}
                  className="border-b border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta?.hue }} />
                      <span className="font-semibold text-[var(--ink)]">{meta?.title}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <Badge
                      size="sm"
                      variant={
                        q.difficulty === 'advanced'
                          ? 'danger'
                          : q.difficulty === 'intermediate'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {q.difficulty}
                    </Badge>
                  </td>
                  <td className="p-3 max-w-md">
                    <p className="font-medium text-[var(--ink)] line-clamp-1">{q.question}</p>
                    {q.codeSnippet && (
                      <span className="text-[10px] font-mono text-[var(--muted)]">has code snippet</span>
                    )}
                  </td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-mono font-semibold whitespace-nowrap">
                    {q.options[q.correctIndex]}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="font-display font-bold text-lg text-[var(--ink)]">
                Add New Question
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--ink)]">Topic</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value as TopicId)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)]"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--ink)]">Calibrated Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)]"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--ink)]">Question Text</label>
                <input
                  type="text"
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. What is the output of print(type([]))?"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--ink)]">Code Snippet (Optional)</label>
                <textarea
                  rows={3}
                  value={formSnippet}
                  onChange={(e) => setFormSnippet(e.target.value)}
                  placeholder="nums = [1, 2, 3]&#10;print(nums[::-1])"
                  className="w-full px-3.5 py-2 text-xs font-code rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--ink)]">
                  4 Options (Select radio for correct answer)
                </label>
                {formOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={formCorrectIndex === i}
                      onChange={() => setFormCorrectIndex(i)}
                      className="accent-[#2D5BFF] cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const copy = [...formOptions];
                        copy[i] = e.target.value;
                        setFormOptions(copy);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)]"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--ink)]">Explanation</label>
                <textarea
                  rows={2}
                  required
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why this option is correct in Python..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] space-y-2">
                <span className="text-[10px] font-bold font-display uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#2D5BFF]" /> Live Preview
                </span>
                <p className="text-xs font-bold text-[var(--ink)]">
                  {formQuestion || 'Your question prompt will appear here...'}
                </p>
                {formSnippet && (
                  <pre className="p-2.5 rounded-lg bg-[var(--surface)] text-[11px] font-code text-[var(--ink)] border border-[var(--line)]">
                    {formSnippet}
                  </pre>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold cursor-pointer">
                  Save to Question Bank
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
