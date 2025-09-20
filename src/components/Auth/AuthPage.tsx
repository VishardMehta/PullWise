import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Code2, Github, GitlabIcon as Gitlab } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthPage() {
  const { signInWithGitHub, signInWithGitLab } = useAuth()
  const [loading, setLoading] = useState<'github' | 'gitlab' | null>(null)

  const handleGitHubSignIn = async () => {
    try {
      setLoading('github')
      await signInWithGitHub()
    } catch (error) {
      toast.error('Failed to sign in with GitHub')
      setLoading(null)
    }
  }

  const handleGitLabSignIn = async () => {
    try {
      setLoading('gitlab')
      await signInWithGitLab()
    } catch (error) {
      toast.error('Failed to sign in with GitLab')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PullWise</h1>
          <p className="text-gray-600">
            AI-powered code review and automated fixes for your repositories
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Sign in to continue
          </h2>

          <div className="space-y-4">
            {/* GitHub Sign In */}
            <button
              onClick={handleGitHubSignIn}
              disabled={loading === 'github'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="w-5 h-5 mr-3" />
              {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
            </button>

            {/* GitLab Sign In */}
            <button
              onClick={handleGitLabSignIn}
              disabled={loading === 'gitlab'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gitlab className="w-5 h-5 mr-3" />
              {loading === 'gitlab' ? 'Connecting...' : 'Continue with GitLab'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🤖 AI-Powered Analysis</h3>
            <p className="text-sm text-gray-600">
              Advanced ML models analyze your code for bugs, security issues, and improvements
            </p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">⚡ Automated Fixes</h3>
            <p className="text-sm text-gray-600">
              One-click application of suggested fixes with automatic PR creation
            </p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Team Insights</h3>
            <p className="text-sm text-gray-600">
              Track code quality trends and identify improvement opportunities
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}