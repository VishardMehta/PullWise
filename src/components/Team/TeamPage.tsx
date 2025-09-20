import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search,
  Mail,
  Shield,
  MoreVertical,
  UserPlus,
  Settings,
  Crown,
  Star
} from 'lucide-react'
import { formatRelativeTime } from '../../lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member'
  github_username?: string
  gitlab_username?: string
  last_active: string
  stats: {
    pullRequests: number
    issuesFixed: number
    qualityScore: number
  }
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    role: 'owner',
    github_username: 'alice-dev',
    last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    stats: { pullRequests: 24, issuesFixed: 18, qualityScore: 92 }
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    role: 'admin',
    github_username: 'bob-codes',
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    stats: { pullRequests: 18, issuesFixed: 15, qualityScore: 88 }
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@company.com',
    role: 'member',
    gitlab_username: 'charlie-gl',
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    stats: { pullRequests: 15, issuesFixed: 12, qualityScore: 85 }
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@company.com',
    role: 'member',
    github_username: 'diana-wonder',
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    stats: { pullRequests: 32, issuesFixed: 28, qualityScore: 95 }
  }
]

export function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return Crown
      case 'admin':
        return Shield
      default:
        return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return

    // Mock invite logic
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      last_active: new Date().toISOString(),
      stats: { pullRequests: 0, issuesFixed: 0, qualityScore: 0 }
    }

    setTeamMembers([...teamMembers, newMember])
    setInviteEmail('')
    setInviteRole('member')
    setShowInviteModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">
            Manage team members and track their contributions
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(teamMembers.reduce((acc, member) => acc + member.stats.qualityScore, 0) / teamMembers.length)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fixes</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.reduce((acc, member) => acc + member.stats.issuesFixed, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role)
            
            return (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {member.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        {member.github_username && (
                          <span>GitHub: @{member.github_username}</span>
                        )}
                        {member.gitlab_username && (
                          <span>GitLab: @{member.gitlab_username}</span>
                        )}
                        <span>Last active {formatRelativeTime(member.last_active)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.stats.pullRequests}</div>
                      <div className="text-xs text-gray-500">PRs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.stats.issuesFixed}</div>
                      <div className="text-xs text-gray-500">Fixes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.stats.qualityScore}%</div>
                      <div className="text-xs text-gray-500">Quality</div>
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}