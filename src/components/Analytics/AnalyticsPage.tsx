import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Bug,
  Zap,
  Wrench,
  Palette,
  Calendar,
  Filter
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const mockTrendData = [
  { month: 'Jan', issues: 45, fixes: 38, quality: 82 },
  { month: 'Feb', issues: 38, fixes: 42, quality: 85 },
  { month: 'Mar', issues: 42, fixes: 35, quality: 83 },
  { month: 'Apr', issues: 35, fixes: 48, quality: 87 },
  { month: 'May', issues: 28, fixes: 52, quality: 89 },
  { month: 'Jun', issues: 32, fixes: 45, quality: 88 }
]

const mockCategoryData = [
  { name: 'Security', value: 25, color: '#ef4444' },
  { name: 'Performance', value: 20, color: '#f59e0b' },
  { name: 'Bugs', value: 30, color: '#dc2626' },
  { name: 'Maintainability', value: 15, color: '#8b5cf6' },
  { name: 'Style', value: 10, color: '#06b6d4' }
]

const mockHotspots = [
  { file: 'src/components/UserForm.tsx', issues: 12, trend: 'up' },
  { file: 'src/utils/validation.ts', issues: 8, trend: 'down' },
  { file: 'src/api/auth.ts', issues: 6, trend: 'up' },
  { file: 'src/components/DataTable.tsx', issues: 5, trend: 'stable' },
  { file: 'src/hooks/useAuth.ts', issues: 4, trend: 'down' }
]

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'issues' | 'fixes' | 'quality'>('quality')

  const metrics = [
    {
      title: 'Code Quality Score',
      value: '87%',
      change: '+5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Issues Resolved',
      value: '245',
      change: '+12%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Security Fixes',
      value: '18',
      change: '-8%',
      trend: 'down',
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      title: 'Avg. Fix Time',
      value: '2.3h',
      change: '-15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Track code quality trends and team performance metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <div className="flex items-center mt-2">
                  <metric.icon className={`w-4 h-4 mr-1 ${metric.color}`} />
                  <span className={`text-sm font-medium ${metric.color}`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quality Trends</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="quality">Quality Score</option>
              <option value="issues">Issues Found</option>
              <option value="fixes">Fixes Applied</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issue Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockCategoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issue Hotspots */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Issue Hotspots</h3>
          <p className="text-sm text-gray-600 mt-1">Files with the most frequent issues</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockHotspots.map((hotspot, index) => (
              <div key={hotspot.file} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-gray-900">{hotspot.file}</p>
                    <p className="text-xs text-gray-500">{hotspot.issues} issues</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hotspot.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {hotspot.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                  {hotspot.trend === 'stable' && <div className="w-4 h-4 bg-gray-300 rounded-full" />}
                  <span className="text-sm font-medium text-gray-900">{hotspot.issues}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
          <p className="text-sm text-gray-600 mt-1">Code quality metrics by team member</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Alice', issues: 12, fixes: 18, quality: 92 },
              { name: 'Bob', issues: 8, fixes: 15, quality: 88 },
              { name: 'Charlie', issues: 15, fixes: 12, quality: 85 },
              { name: 'Diana', issues: 6, fixes: 22, quality: 95 },
              { name: 'Eve', issues: 10, fixes: 16, quality: 90 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quality" fill="#3b82f6" name="Quality Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}