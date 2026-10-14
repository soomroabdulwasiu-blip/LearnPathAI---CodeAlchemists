import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  BookOpen,
  GraduationCap,
  History,
  Sliders,
  Search,
  Plus,
  Trash2,
  Edit2,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
  ExternalLink,
  Save,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { UserProfile, Question, InstructorClass, QuizHistoryItem, TopicId, UserRole } from '../types';

const TOPIC_LABELS: Record<TopicId, string> = {
  variables: 'Variables & Data Types',
  operators: 'Operators & Expressions',
  conditionals: 'Conditionals (if/elif/else)',
  loops: 'Loops (for & while)',
  strings: 'Strings & Manipulation',
  lists: 'Lists & Tuples',
  dictionaries: 'Dictionaries & Sets',
  functions: 'Functions & Scope',
  exceptions: 'Exceptions (try/except)',
  oop: 'Object-Oriented (Classes)',
};

const ALL_TOPICS: TopicId[] = [
  'variables',
  'operators',
  'conditionals',
  'loops',
  'strings',
  'lists',
  'dictionaries',
  'functions',
  'exceptions',
  'oop',
];

type ActiveTab = 'users' | 'questions' | 'classes' | 'quizzes' | 'mastery';

export const AdminPage: React.FC = () => {
  const currentUser = useAppStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [quizzes, setQuizzes] = useState<Array<QuizHistoryItem & { userId: string; userName: string; userEmail: string }>>([]);

  // Filter / Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState<string>('all');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<string>('all');
  const [classSearch, setClassSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');

  // Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'student' as UserRole,
    password: '',
    goal: '',
    weeklyHours: 5,
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    topic_id: 'variables' as TopicId,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    question: '',
    codeSnippet: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  });

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<InstructorClass | null>(null);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
  });

  // Mastery Management State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentMasteries, setStudentMasteries] = useState<Record<TopicId, number>>({
    variables: 0,
    operators: 0,
    conditionals: 0,
    loops: 0,
    strings: 0,
    lists: 0,
    dictionaries: 0,
    functions: 0,
    exceptions: 0,
    oop: 0,
  });
  const [masteryLoading, setMasteryLoading] = useState(false);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'user' | 'question' | 'class' | 'quiz';
    id: string;
    extraId?: string;
    title: string;
  }>({
    open: false,
    type: 'user',
    id: '',
    title: '',
  });

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, questionsRes, classesRes, quizzesRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminQuestions(),
        api.getAdminClasses(),
        api.getAdminQuizzes(),
      ]);

      setUsers(usersRes.users || []);
      setQuestions(questionsRes.questions || []);
      setClasses(classesRes.classes || []);
      setQuizzes(quizzesRes.quizzes || []);

      // If no student is selected for mastery, select first student
      if (!selectedStudentId && usersRes.users?.length > 0) {
        const student = usersRes.users.find((u) => u.role === 'student') || usersRes.users[0];
        if (student) {
          setSelectedStudentId(student.id);
          loadStudentMastery(student.id);
        }
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentMastery = async (studentId: string) => {
    if (!studentId) return;
    setMasteryLoading(true);
    try {
      const res = await api.getAdminUserMastery(studentId);
      if (res.mastery) {
        setStudentMasteries({
          variables: res.mastery.variables ?? 0,
          operators: res.mastery.operators ?? 0,
          conditionals: res.mastery.conditionals ?? 0,
          loops: res.mastery.loops ?? 0,
          strings: res.mastery.strings ?? 0,
          lists: res.mastery.lists ?? 0,
          dictionaries: res.mastery.dictionaries ?? 0,
          functions: res.mastery.functions ?? 0,
          exceptions: res.mastery.exceptions ?? 0,
          oop: res.mastery.oop ?? 0,
        });
      }
    } catch (err: any) {
      console.warn('Notice loading student mastery:', err);
    } finally {
      setMasteryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentMastery(selectedStudentId);
    }
  }, [selectedStudentId]);

  // User Actions
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: 'student',
      password: 'Password123!',
      goal: 'Master Python Fundamentals',
      weeklyHours: 5,
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      goal: u.goal || '',
      weeklyHours: u.weeklyHours || 5,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showNotice('error', 'Name and valid email are required.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingUser) {
        await api.updateAdminUser(editingUser.id, {
          name: userForm.name.trim(),
          role: userForm.role,
          goal: userForm.goal.trim(),
          weeklyHours: userForm.weeklyHours,
        });
        showNotice('success', `User ${userForm.name} updated successfully!`);
      } else {
        await api.createAdminUser({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          password: userForm.password || 'Password123!',
          goal: userForm.goal.trim(),
          weeklyHours: userForm.weeklyHours,
        });
        showNotice('success', `User ${userForm.name} created successfully!`);
      }
      setUserModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || newPasswordValue.length < 6) {
      showNotice('error', 'Password must be at least 6 characters.');
      return;
    }
    setActionLoading(true);
    try {
      await api.resetAdminUserPassword(targetUserId, newPasswordValue);
      showNotice('success', 'Password reset successfully!');
      setPasswordModalOpen(false);
      setNewPasswordValue('');
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  // Question Actions
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      topic_id: 'variables',
      difficulty: 'beginner',
      question: '',
      codeSnippet: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({
      topic_id: q.topic_id,
      difficulty: q.difficulty,
      question: q.question,
      codeSnippet: q.codeSnippet || '',
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation || '',
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question.trim()) {
      showNotice('error', 'Question prompt is required.');
      return;
    }
    if (questionForm.options.some((o) => !o.trim())) {
      showNotice('error', 'All 4 options must be filled out.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingQuestion) {
        await api.updateAdminQuestion(editingQuestion.id, {
          topic_id: questionForm.topic_id,
          difficulty: questionForm.difficulty,
          question: questionForm.question.trim(),
          codeSnippet: questionForm.codeSnippet.trim() || undefined,
          options: questionForm.options.map((o) => o.trim()),
          correctIndex: questionForm.correctIndex,
          explanation: questionForm.explanation.trim(),
        });
        showNotice('success', 'Question updated successfully!');
      } else {
        await api.createAdminQuestion({
          topic_id: questionForm.topic_id,
          difficulty: questionForm.difficulty,
          question: questionForm.question.trim(),
          codeSnippet: questionForm.codeSnippet.trim() || undefined,
          options: questionForm.options.map((o) => o.trim()),
          correctIndex: questionForm.correctIndex,
          explanation: questionForm.explanation.trim(),
        });
        showNotice('success', 'Question added to question bank!');
      }
      setQuestionModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save question.');
    } finally {
      setActionLoading(false);
    }
  };

  // Class Actions
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({ name: '', code: '' });
    setClassModalOpen(true);
  };

  const handleOpenEditClass = (c: InstructorClass) => {
    setEditingClass(c);
    setClassForm({ name: c.name, code: c.code });
    setClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      showNotice('error', 'Class name is required.');
      return;
    }
    setActionLoading(true);
    try {
      if (editingClass) {
        await api.updateAdminClass(editingClass.id, {
          name: classForm.name.trim(),
          code: classForm.code.trim() || undefined,
        });
        showNotice('success', 'Class updated successfully!');
      } else {
        await api.createAdminClass({
          name: classForm.name.trim(),
        });
        showNotice('success', 'Class cohort created successfully!');
      }
      setClassModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save class.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mastery Update
  const handleUpdateTopicMastery = async (topicId: TopicId, score: number) => {
    if (!selectedStudentId) return;
    try {
      await api.setAdminUserMastery(selectedStudentId, topicId, score);
      setStudentMasteries((prev) => ({ ...prev, [topicId]: score }));
      showNotice('success', `Updated ${TOPIC_LABELS[topicId]} to ${score}%`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to update mastery.');
    }
  };

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setActionLoading(true);
    try {
      if (deleteConfirm.type === 'user') {
        await api.deleteAdminUser(deleteConfirm.id);
        showNotice('success', 'User deleted successfully.');
      } else if (deleteConfirm.type === 'question') {
        await api.deleteAdminQuestion(deleteConfirm.id);
        showNotice('success', 'Question deleted successfully.');
      } else if (deleteConfirm.type === 'class') {
        await api.deleteAdminClass(deleteConfirm.id);
        showNotice('success', 'Class deleted successfully.');
      } else if (deleteConfirm.type === 'quiz') {
        if (deleteConfirm.extraId) {
          await api.deleteAdminQuiz(deleteConfirm.extraId, deleteConfirm.id);
          showNotice('success', 'Quiz record deleted.');
        }
      }
      setDeleteConfirm({ open: false, type: 'user', id: '', title: '' });
      loadData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !questionSearch ||
      q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.id.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesTopic = questionTopicFilter === 'all' || q.topic_id === questionTopicFilter;
    const matchesDiff = questionDifficultyFilter === 'all' || q.difficulty === questionDifficultyFilter;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  const filteredClasses = classes.filter((c) => {
    return (
      !classSearch ||
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(classSearch.toLowerCase())
    );
  });

  const filteredQuizzes = quizzes.filter((q) => {
    return (
      !quizSearch ||
      q.userName?.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.userEmail?.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.id?.toLowerCase().includes(quizSearch.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] pb-24">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md border animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold font-display tracking-tight text-[var(--ink)]">
                    Admin Data Management
                  </h1>
                  <p className="text-xs text-[var(--muted)]">
                    Create, update, and delete platform data directly
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PostgreSQL Connected
              </span>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
                title="Refresh all data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Simple Tab Navigation */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 border-t border-[var(--line)]/60 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-[#2D5BFF] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'questions'
                  ? 'bg-[#2D5BFF] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Questions Bank</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
              }`}>
                {questions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'classes'
                  ? 'bg-[#2D5BFF] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Classes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
              }`}>
                {classes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'quizzes'
                  ? 'bg-[#2D5BFF] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Quiz Attempts</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
              }`}>
                {quizzes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mastery')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'mastery'
                  ? 'bg-[#2D5BFF] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Topic Mastery</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ======================= TAB 1: USERS ======================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or ID..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenAddUser}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--line)] text-[var(--muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Level / XP</th>
                      <th className="py-2.5 px-4">Joined</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                          No users found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = currentUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-500/10 text-[#2D5BFF] flex items-center justify-center font-bold text-xs uppercase">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-[#2D5BFF] font-semibold">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] font-mono">{u.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[var(--ink)] font-mono text-[11px]">
                              {u.email}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : u.role === 'instructor'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[var(--muted)]">
                              Level {u.level || 1} • <span className="font-semibold text-[var(--ink)]">{u.xp || 0} XP</span>
                            </td>
                            <td className="py-3 px-4 text-[var(--muted)] text-[11px]">
                              {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-md hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[#2D5BFF] transition-colors cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetUserId(u.id);
                                    setNewPasswordValue('');
                                    setPasswordModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-md hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-amber-500 transition-colors cursor-pointer"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: 'user',
                                      id: u.id,
                                      title: `Delete user "${u.name}" (${u.email})?`,
                                    })
                                  }
                                  className={`p-1.5 rounded-md transition-colors ${
                                    isSelf
                                      ? 'opacity-30 cursor-not-allowed text-[var(--muted)]'
                                      : 'hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-600 cursor-pointer'
                                  }`}
                                  title={isSelf ? 'Cannot delete yourself' : 'Delete User'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: QUESTIONS ======================= */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search questions by text or ID..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  />
                </div>

                <select
                  value={questionTopicFilter}
                  onChange={(e) => setQuestionTopicFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                >
                  <option value="all">All Topics</option>
                  {ALL_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {TOPIC_LABELS[t]}
                    </option>
                  ))}
                </select>

                <select
                  value={questionDifficultyFilter}
                  onChange={(e) => setQuestionDifficultyFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenAddQuestion}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="bg-[var(--surface)] p-8 text-center rounded-xl border border-[var(--line)] text-[var(--muted)] text-xs">
                  No questions match your filter.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--line)] hover:border-blue-500/40 transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[#2D5BFF] text-[10px] font-bold uppercase font-mono">
                          {q.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-muted)] text-[var(--ink)] text-[10px] font-semibold">
                          {TOPIC_LABELS[q.topic_id] || q.topic_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            q.difficulty === 'beginner'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : q.difficulty === 'intermediate'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditQuestion(q)}
                          className="p-1.5 rounded-md hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[#2D5BFF] transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              type: 'question',
                              id: q.id,
                              title: `Delete question "${q.id}"?`,
                            })
                          }
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)] mb-2">
                      {q.question}
                    </h3>

                    {q.codeSnippet && (
                      <pre className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink)] mb-3 overflow-x-auto">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                : 'bg-[var(--surface-muted)] border-[var(--line)] text-[var(--ink)]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-[var(--surface)] text-[var(--muted)]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-[var(--muted)] bg-[var(--surface-muted)]/50 p-2 rounded-lg border border-[var(--line)]/60">
                        <span className="font-bold text-[var(--ink)]">Explanation: </span>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: CLASSES ======================= */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Search classes by name or code..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenAddClass}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Class</span>
              </button>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--line)] text-[var(--muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Class Name</th>
                      <th className="py-2.5 px-4">Class Code</th>
                      <th className="py-2.5 px-4">Students Enrolled</th>
                      <th className="py-2.5 px-4">Average Mastery</th>
                      <th className="py-2.5 px-4">Created Date</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-medium">
                    {filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                          No classes found. Click "+ Create Class" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredClasses.map((c) => (
                        <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="py-3 px-4 font-bold text-[var(--ink)]">
                            {c.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)]">
                            {c.studentsCount || 0} students
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${c.averageMastery || 0}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-[var(--ink)]">{c.averageMastery || 0}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)] text-[11px]">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditClass(c)}
                                className="p-1.5 rounded-md hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[#2D5BFF] transition-colors cursor-pointer"
                                title="Edit Class"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'class',
                                    id: c.id,
                                    title: `Delete class "${c.name}" (${c.code})?`,
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Class"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: QUIZZES ======================= */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
              <div className="relative max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={quizSearch}
                  onChange={(e) => setQuizSearch(e.target.value)}
                  placeholder="Search attempts by student name or email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--line)] text-[var(--muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Mode / Type</th>
                      <th className="py-2.5 px-4">Score</th>
                      <th className="py-2.5 px-4">Questions</th>
                      <th className="py-2.5 px-4">Completed Date</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-medium">
                    {filteredQuizzes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                          No quiz history records recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredQuizzes.map((qz) => (
                        <tr key={qz.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--ink)]">{qz.userName || 'Anonymous Student'}</div>
                            <div className="text-[11px] text-[var(--muted)] font-mono">{qz.userEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[#2D5BFF] text-[10px] font-bold capitalize">
                              {qz.subject || 'assessment'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                qz.score >= 70
                                  ? 'text-emerald-500'
                                  : qz.score >= 50
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                              }`}
                            >
                              {qz.score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)]">
                            {qz.correctCount} / {qz.totalQuestions} correct
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)] text-[11px]">
                            {qz.date ? new Date(qz.date).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: 'quiz',
                                  id: qz.id,
                                  extraId: qz.userId,
                                  title: `Delete quiz record for ${qz.userName} (${qz.score}%)?`,
                                })
                              }
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 5: TOPIC MASTERY ======================= */}
        {activeTab === 'mastery' && (
          <div className="space-y-4">
            {/* Student Picker Bar */}
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)]">
                  Calibrate Student Mastery Scores
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Directly adjust topic knowledge scores (0 - 100%) for any registered student
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[var(--muted)] shrink-0">Select Student:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] font-semibold focus:outline-none focus:border-[#2D5BFF]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) [{u.role}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topics Mastery Table */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-xs p-4">
              {masteryLoading ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2D5BFF]" />
                  Loading mastery scores...
                </div>
              ) : (
                <div className="space-y-3">
                  {ALL_TOPICS.map((topicId) => {
                    const currentVal = studentMasteries[topicId] ?? 0;
                    return (
                      <div
                        key={topicId}
                        className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="sm:w-1/3">
                          <span className="font-bold text-xs text-[var(--ink)] block">
                            {TOPIC_LABELS[topicId]}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-mono">{topicId}</span>
                        </div>

                        {/* Slider and Value */}
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudentMasteries((prev) => ({ ...prev, [topicId]: val }));
                            }}
                            className="flex-1 h-1.5 rounded-lg bg-[var(--line)] appearance-none cursor-pointer accent-[#2D5BFF]"
                          />
                          <div className="w-12 text-right font-mono font-bold text-xs text-[var(--ink)]">
                            {currentVal}%
                          </div>
                        </div>

                        {/* Save Button */}
                        <button
                          type="button"
                          onClick={() => handleUpdateTopicMastery(topicId, currentVal)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================= MODAL: ADD / EDIT USER ======================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold text-sm text-[var(--ink)]">
                {editingUser ? 'Edit User Profile' : 'Add New User'}
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@learnpath.ai"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Defaults to Password123!"
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Learning / Teaching Goal</label>
                <input
                  type="text"
                  value={userForm.goal}
                  onChange={(e) => setUserForm({ ...userForm, goal: e.target.value })}
                  placeholder="e.g. Master Python Data Science"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: RESET PASSWORD ======================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Reset User Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT QUESTION ======================= */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold text-sm text-[var(--ink)]">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                type="button"
                onClick={() => setQuestionModalOpen(false)}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Topic</label>
                  <select
                    value={questionForm.topic_id}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic_id: e.target.value as TopicId })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  >
                    {ALL_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {TOPIC_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={2}
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="What is the output of the following Python snippet?"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  Code Snippet (Optional)
                </label>
                <textarea
                  rows={2}
                  value={questionForm.codeSnippet}
                  onChange={(e) => setQuestionForm({ ...questionForm, codeSnippet: e.target.value })}
                  placeholder="x = [1, 2, 3]&#10;print(len(x))"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Answer Options (Select the correct answer button):
                </label>
                {questionForm.options.map((opt, oIdx) => {
                  const isCorrect = questionForm.correctIndex === oIdx;
                  return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuestionForm({ ...questionForm, correctIndex: oIdx })}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:bg-[var(--surface-hover)]'
                        }`}
                        title="Click to mark as correct answer"
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...questionForm.options];
                          newOpts[oIdx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs text-[var(--ink)] focus:outline-none ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500/5 font-semibold'
                            : 'border-[var(--line)] bg-[var(--surface-muted)]'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Explain why the correct answer is right..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT CLASS ======================= */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold text-sm text-[var(--ink)]">
                {editingClass ? 'Edit Class Cohort' : 'Create Class Cohort'}
              </h3>
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. CS101: Intro to Python"
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                />
              </div>

              {editingClass && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Class Code</label>
                  <input
                    type="text"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    placeholder="e.g. PY101"
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#2D5BFF]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#2D5BFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CONFIRM DELETE ======================= */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-sm text-[var(--ink)]">Confirm Deletion</h3>
              <p className="text-xs text-[var(--muted)] mt-1">{deleteConfirm.title}</p>
              <p className="text-[11px] text-rose-500 mt-2 font-medium">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, type: 'user', id: '', title: '' })}
                className="px-4 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
