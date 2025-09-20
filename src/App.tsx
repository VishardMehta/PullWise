import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout/Layout'
import { AuthPage } from './components/Auth/AuthPage'
import { DashboardPage } from './components/Dashboard/DashboardPage'
import { RepositoriesPage } from './components/Repositories/RepositoriesPage'
import { PullRequestsPage } from './components/PullRequests/PullRequestsPage'
import { PullRequestDetail } from './components/PullRequests/PullRequestDetail'
import { AnalyticsPage } from './components/Analytics/AnalyticsPage'
import { TeamPage } from './components/Team/TeamPage'
import { SettingsPage } from './components/Settings/SettingsPage'

const queryClient = new QueryClient()

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="repositories" element={<RepositoriesPage />} />
          <Route path="pull-requests" element={<PullRequestsPage />} />
          <Route path="pull-requests/:id" element={<PullRequestDetail />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App