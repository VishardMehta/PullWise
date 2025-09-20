import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  GitBranch, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRelativeTime } from '../../lib/utils'

interface DashboardStats {
  totalRepositories: number
  activePullRequests: number
  pendingAnalyses: number
  fixesApplied: number
  securityIssues: number
  codeQualityScore: number
}

interface RecentActivity {
  id: string
  type: 'analysis_completed' | 'fix_applied' | 'pr_opened'
  repository: string
  pullRequest: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRepositories: 0,
    activePullRequests: 0,
    pendingAnalyses: 0,
    fixesApplied: 0,
    securityIssues: 0,
    codeQualityScore: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load repositories count
      const { count: repoCount } = await supabase
        .from('repositories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Load active pull requests
      const { count: prCount } = await supabase
        .from('pull_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')

      // Load pending analyses
      const { count: pendingCount } = await supabase
        .from('analysis_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'running'])

      // Load applied fixes
      const { count: fixesCount } = await supabase
        .from('ml_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('is_applied', true)

      // Load security issues
      const { count: securityCount } = await supabase
        .from('ml_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'security')
        .eq('is_applied', false)

      setStats({
        totalRepositories: repoCount || 0,
        activePullRequests: prCount || 0,
        pendingAnalyses: pendingCount || 0,
        fixesApplied: fixesCount || 0,
        securityIssues: securityCount || 0,
        codeQualityScore: 87 // Mock score
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'analysis_completed',
          repository: 'frontend-app',
          pullRequest: 'Add user authentication',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'fix_applied',
          repository: 'api-server',
          pullRequest: 'Fix security vulnerability',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'pr_opened',
          repository: 'mobile-app',
          pullRequest: 'Optimize database queries',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'warning'
        }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Repositories',
      value: stats.totalRepositories,
      icon: GitBranch,
      color: 'blue',
      change: '+2 this week'
    },
    {
      title: 'Active PRs',
      value: stats.activePullRequests,
      icon: FileText,
      color: 'green',
      change: '+5 today'
    },
    {
      title: 'Pending Analysis',
      value: stats.pendingAnalyses,
      icon: Clock,
      color: 'yellow',
      change: '-3 from yesterday'
    },
    {
      title: 'Fixes Applied',
      value: stats.fixesApplied,
      icon: CheckCircle,
      color: 'emerald',
      change: '+12 this week'
    },
    {
      title: 'Security Issues',
      value: stats.securityIssues,
      icon: Shield,
      color: 'red',
      change: '-2 from last week'
    },
    {
      title: 'Quality Score',
      value: `${stats.codeQualityScore}%`,
      icon: TrendingUp,
      color: 'purple',
      change: '+5% this month'
    }
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your code reviews.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.repository}</span>
                      {' - '}
                      {activity.type === 'analysis_completed' && 'Analysis completed for'}
                      {activity.type === 'fix_applied' && 'Fix applied to'}
                      {activity.type === 'pr_opened' && 'New PR opened for'}
                      {' '}
                      <span className="font-medium">{activity.pullRequest}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                to="/activity"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                to="/repositories/new"
                className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <GitBranch className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Add Repository</p>
                    <p className="text-sm text-gray-500">Connect a new repository for analysis</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/pull-requests"
                className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Review Pull Requests</p>
                    <p className="text-sm text-gray-500">Check pending code reviews</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-500">Analyze code quality trends</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/team"
                className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Team</p>
                    <p className="text-sm text-gray-500">Invite team members and set permissions</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Code Quality Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Code Quality Trends</h2>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Analytics chart will be displayed here</p>
              <p className="text-sm">Connect repositories to see trends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}