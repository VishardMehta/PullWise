import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Filter,
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRelativeTime, getSeverityColor } from '../../lib/utils'

interface PullRequest {
  id: string
  repository_id: string
  provider_pr_id: string
  title: string
  description: string | null
  author: string
  base_branch: string
  head_branch: string
  status: 'open' | 'closed' | 'merged'
  files_changed: number
  lines_added: number
  lines_deleted: number
  created_at: string
  updated_at: string
  repository: {
    name: string
    full_name: string
    provider: 'github' | 'gitlab'
  }
  analysis_jobs: Array<{
    id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    completed_at: string | null
  }>
  _counts?: {
    issues: number
    suggestions: number
    appliedFixes: number
  }
}

export function PullRequestsPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'merged'>('all')

  useEffect(() => {
    loadPullRequests()
  }, [])

  const loadPullRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pull_requests')
        .select(`
          *,
          repository:repositories(name, full_name, provider),
          analysis_jobs(id, status, completed_at)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Mock additional counts for demo
      const pullRequestsWithCounts = data?.map(pr => ({
        ...pr,
        _counts: {
          issues: Math.floor(Math.random() * 10) + 1,
          suggestions: Math.floor(Math.random() * 5) + 1,
          appliedFixes: Math.floor(Math.random() * 3)
        }
      })) || []

      setPullRequests(pullRequestsWithCounts)
    } catch (error) {
      console.error('Error loading pull requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPullRequests = pullRequests.filter(pr => {
    const matchesSearch = pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pr.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pr.repository.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'merged':
        return 'bg-purple-100 text-purple-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnalysisStatus = (jobs: any[]) => {
    if (jobs.length === 0) return { status: 'none', color: 'text-gray-400' }
    
    const latestJob = jobs[0]
    switch (latestJob.status) {
      case 'pending':
      case 'running':
        return { status: 'running', color: 'text-yellow-600' }
      case 'completed':
        return { status: 'completed', color: 'text-green-600' }
      case 'failed':
        return { status: 'failed', color: 'text-red-600' }
      default:
        return { status: 'none', color: 'text-gray-400' }
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pull Requests</h1>
          <p className="text-gray-600">
            Review and manage pull requests across your repositories
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search pull requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="merged">Merged</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Pull Requests List */}
      {filteredPullRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pull requests found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Pull requests will appear here when you connect repositories'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPullRequests.map((pr) => {
            const analysisStatus = getAnalysisStatus(pr.analysis_jobs)
            
            return (
              <div
                key={pr.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          to={`/pull-requests/${pr.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {pr.title}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
                          {pr.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <GitBranch className="w-4 h-4 mr-1" />
                          {pr.repository.name}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {pr.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatRelativeTime(pr.created_at)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {pr.description || 'No description provided'}
                      </p>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center text-green-600">
                          <span className="font-medium">+{pr.lines_added}</span>
                          <span className="ml-1">additions</span>
                        </div>
                        <div className="flex items-center text-red-600">
                          <span className="font-medium">-{pr.lines_deleted}</span>
                          <span className="ml-1">deletions</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium">{pr.files_changed}</span>
                          <span className="ml-1">files changed</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className={`flex items-center space-x-1 ${analysisStatus.color}`}>
                        {analysisStatus.status === 'running' && <Clock className="w-4 h-4" />}
                        {analysisStatus.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {analysisStatus.status === 'failed' && <AlertTriangle className="w-4 h-4" />}
                        <span className="text-sm font-medium capitalize">
                          {analysisStatus.status === 'none' ? 'No analysis' : analysisStatus.status}
                        </span>
                      </div>
                      
                      {pr._counts && (
                        <div className="text-right text-sm text-gray-500">
                          <div>{pr._counts.issues} issues found</div>
                          <div>{pr._counts.suggestions} suggestions</div>
                          <div>{pr._counts.appliedFixes} fixes applied</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{pr.head_branch}</span>
                      <span>→</span>
                      <span>{pr.base_branch}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/pull-requests/${pr.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        View Analysis
                      </Link>
                      <a
                        href={`https://${pr.repository.provider}.com/${pr.repository.full_name}/pull/${pr.provider_pr_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open in {pr.repository.provider}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}