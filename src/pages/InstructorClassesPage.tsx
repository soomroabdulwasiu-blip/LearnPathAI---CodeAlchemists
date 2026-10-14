import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { InstructorClass } from '../types';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import {
  Users,
  Plus,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

export const InstructorClassesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getClasses().then((data) => {
      if (mounted) {
        setClasses(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const created = await api.createClass(newClassName.trim());
      setClasses([created, ...classes]);
      setNewClassName('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFB92E]/10 text-[#D97706] mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Instructor Portal</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
            {t('classes_title')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Manage your student cohorts and monitor real-time Bayesian competency heatmaps.
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreateModal(true)} className="font-bold cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t('create_class')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--muted)]">Loading cohorts...</div>
      ) : classes.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--line)] text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-[var(--ink)]">
              No student cohorts created yet.
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              Create a new class to generate a unique join code. Students can enter this code during registration to join your cohort.
            </p>
          </div>
          <Button size="md" onClick={() => setShowCreateModal(true)} className="font-bold cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create First Class Cohort</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] hover:border-[#2D5BFF]/50 shadow-xs hover:shadow-md transition-all space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--ink)]">
                    {cls.name}
                  </h3>
                  <span className="text-xs text-[var(--muted)]">Created on {cls.createdAt}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(cls.code)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] hover:border-[#2D5BFF] transition-all cursor-pointer"
                  title="Copy student join code"
                >
                  <span>{cls.code}</span>
                  {copiedCode === cls.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--surface-muted)] text-xs">
                <div>
                  <span className="text-[11px] text-[var(--muted)]">Enrolled Students</span>
                  <div className="font-display font-black text-xl text-[var(--ink)] mt-0.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2D5BFF]" />
                    <span>{cls.studentsCount}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--muted)]">Average Cohort Mastery</span>
                  <div className="font-display font-black text-xl text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>{cls.averageMastery}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => navigate(`/instructor/classes/${cls.id}`)}
                  className="font-bold cursor-pointer"
                >
                  <span>Open Class Heatmap</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-lg text-[var(--ink)]">
              {t('create_class')}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--ink)]">Class Name & Cohort</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. CS101: Python Fundamentals"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                A unique student join code will be generated automatically. Students can enter this code during registration to join your cohort.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold cursor-pointer">
                  Generate Join Code
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
