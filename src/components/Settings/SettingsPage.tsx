import { useState } from 'react'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  GitBranch,
  Zap,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'integrations' | 'automation'>('profile')
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@company.com',
    github_username: 'johndoe',
    gitlab_username: '',
    timezone: 'UTC-8'
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_analysis_complete: true,
    email_security_issues: true,
    email_weekly_summary: false,
    slack_notifications: false,
    slack_webhook: ''
  })

  // Security settings
  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    api_key: 'pw_1234567890abcdef',
    webhook_secret: 'whsec_1234567890abcdef'
  })

  // Automation settings
  const [automation, setAutomation] = useState({
    auto_fix_enabled: true,
    auto_fix_categories: ['style', 'performance'],
    require_approval: true,
    max_fixes_per_pr: 5
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: GitBranch },
    { id: 'automation', label: 'Automation', icon: Zap }
  ]

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Username
                      </label>
                      <input
                        type="text"
                        value={profile.github_username}
                        onChange={(e) => setProfile({ ...profile, github_username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitLab Username
                      </label>
                      <input
                        type="text"
                        value={profile.gitlab_username}
                        onChange={(e) => setProfile({ ...profile, gitlab_username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">UTC</option>
                      <option value="UTC+1">Central European Time (UTC+1)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'email_analysis_complete', label: 'Analysis completed', description: 'Get notified when PR analysis is finished' },
                        { key: 'email_security_issues', label: 'Security issues found', description: 'Immediate alerts for security vulnerabilities' },
                        { key: 'email_weekly_summary', label: 'Weekly summary', description: 'Weekly report of code quality metrics' }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={notifications[setting.key as keyof typeof notifications] as boolean}
                            onChange={(e) => setNotifications({ 
                              ...notifications, 
                              [setting.key]: e.target.checked 
                            })}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <label className="text-sm font-medium text-gray-900">{setting.label}</label>
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Slack Integration</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={notifications.slack_notifications}
                          onChange={(e) => setNotifications({ 
                            ...notifications, 
                            slack_notifications: e.target.checked 
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-900">Enable Slack notifications</label>
                          <p className="text-sm text-gray-500">Send notifications to your Slack workspace</p>
                        </div>
                      </div>
                      
                      {notifications.slack_notifications && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Slack Webhook URL
                          </label>
                          <input
                            type="url"
                            value={notifications.slack_webhook}
                            onChange={(e) => setNotifications({ 
                              ...notifications, 
                              slack_webhook: e.target.value 
                            })}
                            placeholder="https://hooks.slack.com/services/..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={security.two_factor_enabled}
                        onChange={(e) => setSecurity({ 
                          ...security, 
                          two_factor_enabled: e.target.checked 
                        })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-900">Enable 2FA</label>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">API Access</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={security.api_key}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Use this key to access the PullWise API
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Automation Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Auto-Fix Configuration</h4>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={automation.auto_fix_enabled}
                          onChange={(e) => setAutomation({ 
                            ...automation, 
                            auto_fix_enabled: e.target.checked 
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-900">Enable automatic fixes</label>
                          <p className="text-sm text-gray-500">Automatically apply low-risk fixes</p>
                        </div>
                      </div>

                      {automation.auto_fix_enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Auto-fix categories
                            </label>
                            <div className="space-y-2">
                              {['style', 'performance', 'maintainability', 'security', 'bug'].map((category) => (
                                <div key={category} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={automation.auto_fix_categories.includes(category)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAutomation({
                                          ...automation,
                                          auto_fix_categories: [...automation.auto_fix_categories, category]
                                        })
                                      } else {
                                        setAutomation({
                                          ...automation,
                                          auto_fix_categories: automation.auto_fix_categories.filter(c => c !== category)
                                        })
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label className="text-sm text-gray-700 capitalize">{category}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Maximum fixes per PR
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={automation.max_fixes_per_pr}
                              onChange={(e) => setAutomation({ 
                                ...automation, 
                                max_fixes_per_pr: parseInt(e.target.value) 
                              })}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={automation.require_approval}
                              onChange={(e) => setAutomation({ 
                                ...automation, 
                                require_approval: e.target.checked 
                              })}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <label className="text-sm font-medium text-gray-900">Require approval</label>
                              <p className="text-sm text-gray-500">Create draft PRs that require manual approval</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}