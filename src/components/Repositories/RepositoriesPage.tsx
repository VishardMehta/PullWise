import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  GitBranch, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRelativeTime } from '../../lib/utils'
import toast from 'react-hot-toast'

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  provider: 'github' | 'gitlab'
  is_private: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  _count?: {
    pull_requests: number
    analysis_jobs: number
  }
}

export function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvider, setFilterProvider] = useState<'all' | 'github' | 'gitlab'>('all')

  useEffect(() => {
    loadRepositories()
  }, [])

  const loadRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Mock additional data for demo
      const repositoriesWithCounts = data?.map(repo => ({
        ...repo,
        _count: {
          pull_requests: Math.floor(Math.random() * 20) + 1,
          analysis_jobs: Math.floor(Math.random() * 50) + 5
        }
      })) || []

      setRepositories(repositoriesWithCounts)
    } catch (error) {
      console.error('Error loading repositories:', error)
      toast.error('Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const toggleRepositoryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('repositories')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setRepositories(repos =>
        repos.map(repo =>
          repo.id === id ? { ...repo, is_active: !currentStatus } : repo
        )
      )

      toast.success(`Repository ${!currentStatus ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating repository:', error)
      toast.error('Failed to update repository')
    }
  }

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProvider = filterProvider === 'all' || repo.provider === filterProvider
    return matchesSearch && matchesProvider
  })

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-48"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
          <p className="text-gray-600">
            Manage your connected repositories and their analysis settings
          </p>
        </div>
        <Link
          to="/repositories/connect"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Repository
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Providers</option>
          <option value="github">GitHub</option>
          <option value="gitlab">GitLab</option>
        </select>
      </div>

      {/* Repository Grid */}
      {filteredRepositories.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterProvider !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by connecting your first repository'
            }
          </p>
          {!searchTerm && filterProvider === 'all' && (
            <Link
              to="/repositories/connect"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Repository
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepositories.map((repo) => (
            <div
              key={repo.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      repo.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {repo.name}
                    </h3>
                    {repo.is_private ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      repo.provider === 'github' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {repo.provider}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {repo.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{repo._count?.pull_requests || 0} PRs</span>
                  <span>{repo._count?.analysis_jobs || 0} analyses</span>
                  <span>Updated {formatRelativeTime(repo.updated_at)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/repositories/${repo.id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                  <button
                    onClick={() => toggleRepositoryStatus(repo.id, repo.is_active)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      repo.is_active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {repo.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}