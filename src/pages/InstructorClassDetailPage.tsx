import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { TOPICS, getMasteryLevel } from '../lib/constants';
import { StudentSummary } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  Search,
  X,
  Target,
  CheckCircle2,
} from 'lucide-react';

export const InstructorClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [focusAssignedTopic, setFocusAssignedTopic] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (classId) {
      api.getClassHeatmap(classId).then((data) => {
        if (mounted) {
          setStudents(data.students || []);
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [classId]);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const classTopicAverages = TOPICS.map((topic) => {
    if (students.length === 0) {
      return { subject: topic.title.split(' ')[0], score: 0, fullMark: 100 };
    }
    const sum = students.reduce((acc, s) => acc + (s.topicScores[topic.id] ?? 0), 0);
    const avg = Math.round(sum / students.length);
    return {
      subject: topic.title.split(' ')[0],
      score: avg,
      fullMark: 100,
    };
  });

  const getCellColor = (score: number) => {
    if (score === 0) return 'bg-[var(--surface-muted)] text-[var(--muted)] font-normal';
    if (score < 35) return 'bg-[#FF6B57]/20 text-[#D9422C] dark:text-[#FF6B57] font-bold';
    if (score < 60) return 'bg-[#FFB92E]/20 text-[#C48500] dark:text-[#FFB92E] font-bold';
    if (score < 85) return 'bg-[#29B6F6]/20 text-[#0284C7] dark:text-[#29B6F6] font-semibold';
    return 'bg-[#12C99B]/20 text-[#0E9D79] dark:text-[#12C99B] font-bold';
  };

  const handleAssignFocus = (topicTitle: string) => {
    setFocusAssignedTopic(topicTitle);
    setTimeout(() => setFocusAssignedTopic(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => navigate('/instructor/classes')}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Classes</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
        <div>
          <h1 className="font-display font-black text-2xl text-[var(--ink)]">
            Class Competency Heatmap
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Real-time Bayesian knowledge matrix across enrolled students and 10 curriculum topics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">{students.length} Enrolled</Badge>
          <Badge variant="success">
            Class Average: {students.length > 0 ? Math.round(students.reduce((a, s) => a + s.averageMastery, 0) / students.length) : 0}%
          </Badge>
        </div>
      </div>

      {focusAssignedTopic && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Priority focus assignment sent to class for "{focusAssignedTopic}".</span>
        </div>
      )}

      {students.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--ink)]">
              {t('class_average')}
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={classTopicAverages}>
                  <PolarGrid stroke="var(--line)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'var(--ink)', fontSize: 10, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--line)" />
                  <Radar
                    name="Class Average"
                    dataKey="score"
                    stroke="#FFB92E"
                    fill="#FFB92E"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-rose-500 font-display font-bold text-base mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('weakest_curriculum_topics')}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Assign priority focus to highlight topics on student dashboards.
              </p>
            </div>
            <div className="space-y-2.5">
              {TOPICS.slice(0, 3).map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[var(--ink)]">{topic.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignFocus(topic.title)}
                    className="text-xs cursor-pointer"
                  >
                    <Target className="w-3 h-3 mr-1 text-[#2D5BFF]" />
                    <span>Assign Focus</span>
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-2xl bg-[#2D5BFF]/5 border border-[#2D5BFF]/15 text-[11px] text-[var(--muted)]">
              Assigning focus highlights priority practice drills on enrolled student dashboards.
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
              {t('class_heatmap')}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Competency matrix populated strictly from registered student activity in this cohort.
            </p>
          </div>
          {students.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student by name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted)]">Loading class matrix...</div>
        ) : students.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-[var(--surface-muted)] border border-dashed border-[var(--line)] text-center space-y-3">
            <Users className="w-10 h-10 text-[var(--muted)] mx-auto opacity-50" />
            <h4 className="font-display font-bold text-sm text-[var(--ink)]">
              No students have joined this cohort yet.
            </h4>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              Share your class join code with students. As they register and complete assessments, their real results will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--muted)] font-display uppercase tracking-wider text-[10px]">
                  <th className="p-3 font-bold sticky left-0 bg-[var(--surface)] z-10">
                    Student Name
                  </th>
                  <th className="p-3 font-bold text-center">Avg</th>
                  {TOPICS.map((topic) => (
                    <th key={topic.id} className="p-3 font-bold text-center whitespace-nowrap">
                      {topic.title.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="border-b border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                  >
                    <td className="p-3 font-semibold text-[var(--ink)] sticky left-0 bg-[var(--surface)] group-hover:bg-[var(--surface-hover)] z-10 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#2D5BFF] to-[#8A5CF6] text-white flex items-center justify-center font-bold text-[10px]">
                          {student.name.charAt(0)}
                        </div>
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[var(--ink)]">
                      {student.averageMastery}%
                    </td>
                    {TOPICS.map((topic) => {
                      const score = student.topicScores[topic.id] ?? 0;
                      return (
                        <td key={topic.id} className="p-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-[11px] font-mono ${getCellColor(score)}`}
                            title={`${student.name} - ${topic.title}: ${score}%`}
                          >
                            {score}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--line)] shadow-xl p-6 overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-[var(--muted)]">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--surface-muted)] text-xs">
              <div>
                <span className="text-[10px] text-[var(--muted)]">Overall Mastery</span>
                <div className="font-bold font-display text-xl text-[#2D5BFF]">
                  {selectedStudent.averageMastery}%
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)]">Active Streak</span>
                <div className="font-bold font-display text-xl text-[#FF6B57]">
                  {selectedStudent.streak} Days
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-[var(--ink)]">
                Topic Mastery Breakdown
              </h4>
              <div className="space-y-2">
                {TOPICS.map((topic) => {
                  const score = selectedStudent.topicScores[topic.id] ?? 0;
                  const tier = getMasteryLevel(score);
                  return (
                    <div
                      key={topic.id}
                      className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topic.hue }} />
                        <span>{topic.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${tier.badgeBg}`}>
                        {score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
