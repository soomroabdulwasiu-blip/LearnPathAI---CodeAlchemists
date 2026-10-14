import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { TOPIC_MAP } from '../lib/constants';
import { QuizHistoryItem, TopicId } from '../types';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import {
  History,
  Calendar,
  Clock,
  Play,
  FileQuestion,
  Eye,
} from 'lucide-react';

export const QuizHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QuizHistoryItem | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getHistory().then((items) => {
      if (mounted) {
        setHistoryItems(items);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7C3AED]/10 text-[#7C3AED] mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Diagnostic & Practice Logs</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            Quiz & Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Review your past assessment attempts, calibrated scores, and topic breakdowns.
          </p>
        </div>
        <Button size="md" onClick={() => navigate('/diagnostic')} className="font-bold cursor-pointer">
          <Play className="w-4 h-4 mr-1.5 fill-white" />
          <span>New Assessment</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--muted)]">Loading assessment history...</div>
      ) : historyItems.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--line)] text-center space-y-4">
          <FileQuestion className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-[var(--ink)]">
              You haven't completed any quizzes yet.
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              Your quiz records, accuracy percentages, and topic-wise diagnostic results will appear here as soon as you complete your first assessment.
            </p>
          </div>
          <Button size="md" onClick={() => navigate('/diagnostic')} className="font-bold cursor-pointer">
            <Play className="w-4 h-4 fill-white mr-1.5" />
            <span>Start Diagnostic Quiz</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs hover:border-[#2D5BFF]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.durationMinutes} mins duration
                  </span>
                  <span>•</span>
                  <span>{item.totalQuestions} Questions</span>
                </div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  {item.subject}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {Object.entries(item.topicBreakdown).map(([tid, score]) => {
                    const meta = TOPIC_MAP[tid as TopicId];
                    if (!meta) return null;
                    return (
                      <span
                        key={tid}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)]"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.hue }} />
                        <span>{meta.title.split(' ')[0]}: {score}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)]">
                <div className="text-right">
                  <div className="font-display font-black text-2xl text-[#10B981]">
                    {item.score}%
                  </div>
                  <span className="text-[11px] text-[var(--muted)]">
                    {item.correctCount} / {item.totalQuestions} correct
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>Review Details</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--ink)]">
                  {selectedItem.subject}
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  Completed on {selectedItem.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[var(--surface-muted)] text-center">
              <div>
                <span className="text-[11px] text-[var(--muted)]">Calibrated Score</span>
                <div className="font-display font-black text-3xl text-[#10B981] mt-0.5">
                  {selectedItem.score}%
                </div>
              </div>
              <div>
                <span className="text-[11px] text-[var(--muted)]">Answer Accuracy</span>
                <div className="font-display font-black text-3xl text-[#2D5BFF] mt-0.5">
                  {selectedItem.correctCount}/{selectedItem.totalQuestions}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--ink)]">Topic Mastery Breakdown:</h4>
              <div className="space-y-1.5">
                {Object.entries(selectedItem.topicBreakdown).map(([tid, score]) => {
                  const meta = TOPIC_MAP[tid as TopicId];
                  if (!meta) return null;
                  return (
                    <div
                      key={tid}
                      className="p-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.hue }} />
                        <span className="font-semibold">{meta.title}</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--ink)]">{score}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedItem(null)} className="cursor-pointer">
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedItem(null);
                  navigate('/practice');
                }}
                className="cursor-pointer"
              >
                Practice Recommendations
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
