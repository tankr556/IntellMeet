import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { LobbyPage } from './pages/LobbyPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { TeamPage } from './pages/TeamPage';
import { VideoRoomPage } from './pages/VideoRoomPage';
import { PostMeetingDashboardPage } from './pages/PostMeetingDashboardPage';
import { KanbanBoardPage } from './pages/KanbanBoardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route path="/room/:roomId" element={<VideoRoomPage />} />
          <Route
            path="/summary/:meetingId"
            element={
              <ProtectedRoute>
                <PostMeetingDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <KanbanBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <KanbanBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/tasks"
            element={
              <ProtectedRoute>
                <KanbanBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;


