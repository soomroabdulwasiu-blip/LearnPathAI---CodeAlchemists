import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppSidebar } from './components/layout/AppSidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { DiffBanner } from './components/layout/DiffBanner';
import { TutorDrawer } from './components/tutor/TutorDrawer';
import { CommandPalette } from './components/ui/CommandPalette';
import { PageTransition } from './components/layout/PageTransition';
import { InteractiveCursor } from './components/ui/InteractiveCursor';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { ResultsPage } from './pages/ResultsPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { PracticePage } from './pages/PracticePage';
import { CodeLabPage } from './pages/CodeLabPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReviewPage } from './pages/ReviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { GoalsPage } from './pages/GoalsPage';
import { QuizHistoryPage } from './pages/QuizHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstructorClassesPage } from './pages/InstructorClassesPage';
import { InstructorClassDetailPage } from './pages/InstructorClassDetailPage';
import { InstructorContentPage } from './pages/InstructorContentPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ProtectedRoute({
  children,
  instructorOnly = false,
  adminOnly = false,
}: {
  children: React.ReactNode;
  instructorOnly?: boolean;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, user } = useAppStore();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (instructorOnly && user.role !== 'instructor' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function RootRoute() {
  const { isAuthenticated } = useAppStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <AuthPage initialMode="login" />;
}

function AppLayout() {
  const { theme, language, isAuthenticated } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    (!isAuthenticated && location.pathname === '/');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
  }, [language]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      <InteractiveCursor />
      <Toaster position="top-right" richColors />

      {!isAuthPage && isAuthenticated && (
        <AppSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col min-w-0 ${!isAuthPage && isAuthenticated ? 'lg:pl-[264px]' : ''}`}>
        {!isAuthPage && isAuthenticated && <DiffBanner />}
        {!isAuthPage && isAuthenticated && <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />}

        <main className="flex-1 pb-16 lg:pb-8 overflow-x-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full min-h-full flex flex-col"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <RootRoute />
                    </PageTransition>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PageTransition>
                      {isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage initialMode="login" />}
                    </PageTransition>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PageTransition>
                      {isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage initialMode="signup" />}
                    </PageTransition>
                  }
                />

                {/* Protected Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <DashboardPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/diagnostic"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <DiagnosticPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/results"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <ResultsPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <RoadmapPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/topics/:topicId"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <TopicDetailPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/practice"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <PracticePage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/codelab"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <CodeLabPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <ResourcesPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assistant"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <AIAssistantPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <ReviewPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <ProgressPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <GoalsPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <QuizHistoryPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <SettingsPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Instructor Routes */}
                <Route
                  path="/instructor/classes"
                  element={
                    <ProtectedRoute instructorOnly>
                      <PageTransition>
                        <InstructorClassesPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/classes/:classId"
                  element={
                    <ProtectedRoute instructorOnly>
                      <PageTransition>
                        <InstructorClassDetailPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/content"
                  element={
                    <ProtectedRoute instructorOnly>
                      <PageTransition>
                        <InstructorContentPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <PageTransition>
                        <AdminPage />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <PageTransition>
                      <NotFoundPage />
                    </PageTransition>
                  }
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAuthPage && isAuthenticated && <Footer />}
        {!isAuthPage && isAuthenticated && <MobileNav />}
        {!isAuthPage && isAuthenticated && <TutorDrawer />}
        {!isAuthPage && isAuthenticated && <CommandPalette />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
