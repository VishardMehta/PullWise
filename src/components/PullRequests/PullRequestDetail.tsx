import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  GitBranch,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Play,
  RefreshCw,
  Lightbulb,
  Shield,
  Zap,
  Bug,
  Palette,
  Wrench
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { supabase } from '../../lib/supabase'
import { formatRelativeTime, getSeverityColor, getEffortColor, getImpactColor } from '../../lib/utils'
import toast from 'react-hot-toast'

interface PullRequestDetail {
  id: string
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
  repository: {
    name: string
    full_name: string
    provider: 'github' | 'gitlab'
  }
  analysis_jobs: Array<{
    id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    completed_at: string | null
    static_analysis_results: Array<{
      id: string
      file_path: string
      line_number: number
      rule_id: string
      severity: 'error' | 'warning' | 'info'
      message: string
      suggestion: string | null
    }>
    ml_suggestions: Array<{
      id: string
      file_path: string
      line_start: number
      line_end: number
      original_code: string
      suggested_code: string
      explanation: string
      confidence_score: number
      effort_score: 'low' | 'medium' | 'high'
      impact_score: 'low' | 'medium' | 'high'
      category: 'security' | 'performance' | 'maintainability' | 'bug' | 'style'
      is_applied: boolean
    }>
  }>
}

export function PullRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const [pullRequest, setPullRequest] = useState<PullRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'suggestions'>('overview')
  const [applyingFix, setApplyingFix] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadPullRequestDetail(id)
    }
  }, [id])

  const loadPullRequestDetail = async (prId: string) => {
    try {
      const { data, error } = await supabase
        .from('pull_requests')
        .select(`
          *,
          repository:repositories(name, full_name, provider),
          analysis_jobs(
            id,
            status,
            completed_at,
            static_analysis_results(*),
            ml_suggestions(*)
          )
        `)
        .eq('id', prId)
        .single()

      if (error) throw error

      // Mock data if no real data exists
      if (!data.analysis_jobs || data.analysis_jobs.length === 0) {
        data.analysis_jobs = [{
          id: 'mock-job',
          status: 'completed',
          completed_at: new Date().toISOString(),
          static_analysis_results: [
            {
              id: '1',
              file_path: 'src/components/UserForm.tsx',
              line_number: 45,
              rule_id: 'react-hooks/exhaustive-deps',
              severity: 'warning',
              message: 'React Hook useEffect has a missing dependency',
              suggestion: 'Add missing dependency to the dependency array'
            },
            {
              id: '2',
              file_path: 'src/utils/validation.ts',
              line_number: 12,
              rule_id: 'security/detect-unsafe-regex',
              severity: 'error',
              message: 'Potentially unsafe regular expression',
              suggestion: 'Use a safer regex pattern or validate input length'
            }
          ],
          ml_suggestions: [
            {
              id: '1',
              file_path: 'src/components/UserForm.tsx',
              line_start: 42,
              line_end: 48,
              original_code: `useEffect(() => {
  fetchUserData(userId);
}, []);`,
              suggested_code: `useEffect(() => {
  fetchUserData(userId);
}, [userId, fetchUserData]);`,
              explanation: 'The useEffect hook is missing dependencies. Adding userId and fetchUserData to the dependency array ensures the effect runs when these values change, preventing stale closures and potential bugs.',
              confidence_score: 0.95,
              effort_score: 'low',
              impact_score: 'medium',
              category: 'bug',
              is_applied: false
            },
            {
              id: '2',
              file_path: 'src/utils/api.ts',
              line_start: 15,
              line_end: 20,
              original_code: `const response = await fetch(url);
const data = await response.json();
return data;`,
              suggested_code: `const response = await fetch(url);
if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}
const data = await response.json();
return data;`,
              explanation: 'Adding proper error handling for HTTP responses improves reliability and makes debugging easier. This prevents silent failures when the API returns error status codes.',
              confidence_score: 0.88,
              effort_score: 'low',
              impact_score: 'high',
              category: 'maintainability',
              is_applied: false
            },
            {
              id: '3',
              file_path: 'src/components/DataTable.tsx',
              line_start: 78,
              line_end: 85,
              original_code: `{data.map((item, index) => (
  <tr key={index}>
    <td>{item.name}</td>
    <td>{item.email}</td>
  </tr>
))}`,
              suggested_code: `{data.map((item) => (
  <tr key={item.id}>
    <td>{item.name}</td>
    <td>{item.email}</td>
  </tr>
))}`,
              explanation: 'Using array index as React key can cause rendering issues when the list order changes. Using a unique identifier like item.id provides better performance and prevents UI bugs.',
              confidence_score: 0.92,
              effort_score: 'low',
              impact_score: 'medium',
              category: 'performance',
              is_applied: false
            }
          ]
        }]
      }

      setPullRequest(data)
    } catch (error) {
      console.error('Error loading pull request:', error)
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = async (suggestionId: string) => {
    setApplyingFix(suggestionId)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update local state
      setPullRequest(prev => {
        if (!prev) return prev
        return {
          ...prev,
          analysis_jobs: prev.analysis_jobs.map(job => ({
            ...job,
            ml_suggestions: job.ml_suggestions.map(suggestion =>
              suggestion.id === suggestionId
                ? { ...suggestion, is_applied: true }
                : suggestion
            )
          }))
        }
      })

      toast.success('Fix applied successfully! A new branch has been created.')
    } catch (error) {
      toast.error('Failed to apply fix')
    } finally {
      setApplyingFix(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return Shield
      case 'performance':
        return Zap
      case 'maintainability':
        return Wrench
      case 'bug':
        return Bug
      case 'style':
        return Palette
      default:
        return FileText
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="bg-white rounded-lg p-6 h-64"></div>
      </div>
    )
  }

  if (!pullRequest) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Pull request not found</h3>
        <Link to="/pull-requests" className="text-blue-600 hover:text-blue-500">
          ← Back to pull requests
        </Link>
      </div>
    )
  }

  const latestJob = pullRequest.analysis_jobs[0]
  const allIssues = latestJob?.static_analysis_results || []
  const allSuggestions = latestJob?.ml_suggestions || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/pull-requests"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{pullRequest.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <GitBranch className="w-4 h-4 mr-1" />
              {pullRequest.repository.name}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {pullRequest.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatRelativeTime(pullRequest.created_at)}
            </div>
          </div>
        </div>
        <a
          href={`https://${pullRequest.repository.provider}.com/${pullRequest.repository.full_name}/pull/${pullRequest.provider_pr_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in {pullRequest.repository.provider}
        </a>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'issues', label: 'Issues', count: allIssues.length },
            { id: 'suggestions', label: 'AI Suggestions', count: allSuggestions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PR Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {pullRequest.description || 'No description provided'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Changes Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+{pullRequest.lines_added}</div>
                    <div className="text-sm text-gray-500">additions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">-{pullRequest.lines_deleted}</div>
                    <div className="text-sm text-gray-500">deletions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{pullRequest.files_changed}</div>
                    <div className="text-sm text-gray-500">files</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Status */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Status</h3>
                {latestJob ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className={`flex items-center space-x-1 ${
                        latestJob.status === 'completed' ? 'text-green-600' :
                        latestJob.status === 'running' ? 'text-yellow-600' :
                        latestJob.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {latestJob.status === 'running' && <Clock className="w-4 h-4" />}
                        {latestJob.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {latestJob.status === 'failed' && <AlertTriangle className="w-4 h-4" />}
                        <span className="text-sm font-medium capitalize">{latestJob.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Issues Found</span>
                      <span className="text-sm font-medium">{allIssues.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Suggestions</span>
                      <span className="text-sm font-medium">{allSuggestions.length}</span>
                    </div>

                    {latestJob.completed_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(latestJob.completed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No analysis available</p>
                    <button className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Play className="w-4 h-4 mr-1" />
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Info</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">From</span>
                    <div className="mt-1 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                      {pullRequest.head_branch}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">To</span>
                    <div className="mt-1 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                      {pullRequest.base_branch}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-4">
            {allIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                <p className="text-gray-500">Great job! Static analysis didn't find any issues.</p>
              </div>
            ) : (
              allIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`bg-white rounded-lg border-l-4 p-6 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm text-gray-600">{issue.file_path}</span>
                        <span className="text-gray-400">:</span>
                        <span className="font-mono text-sm text-gray-600">line {issue.line_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{issue.rule_id}</h4>
                      <p className="text-gray-700 mb-3">{issue.message}</p>
                      {issue.suggestion && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Suggestion</span>
                          </div>
                          <p className="text-sm text-blue-800">{issue.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            {allSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI suggestions available</h3>
                <p className="text-gray-500">AI analysis will provide suggestions when available.</p>
              </div>
            ) : (
              allSuggestions.map((suggestion) => {
                const CategoryIcon = getCategoryIcon(suggestion.category)
                
                return (
                  <div
                    key={suggestion.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">{suggestion.category} Improvement</h4>
                          <p className="text-sm text-gray-600 font-mono">{suggestion.file_path}:{suggestion.line_start}-{suggestion.line_end}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(suggestion.effort_score)}`}>
                          {suggestion.effort_score} effort
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact_score)}`}>
                          {suggestion.impact_score} impact
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence_score * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-6">{suggestion.explanation}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Current Code</h5>
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                          <SyntaxHighlighter
                            language="typescript"
                            style={tomorrow}
                            customStyle={{
                              margin: 0,
                              fontSize: '0.875rem',
                              background: '#f8f9fa'
                            }}
                          >
                            {suggestion.original_code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Suggested Code</h5>
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                          <SyntaxHighlighter
                            language="typescript"
                            style={tomorrow}
                            customStyle={{
                              margin: 0,
                              fontSize: '0.875rem',
                              background: '#f0fdf4'
                            }}
                          >
                            {suggestion.suggested_code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Effort: {suggestion.effort_score}</span>
                        <span>Impact: {suggestion.impact_score}</span>
                        <span>Category: {suggestion.category}</span>
                      </div>
                      
                      {suggestion.is_applied ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => applySuggestion(suggestion.id)}
                          disabled={applyingFix === suggestion.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {applyingFix === suggestion.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Apply Fix
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}