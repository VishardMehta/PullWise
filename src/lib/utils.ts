import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export function getSeverityColor(severity: 'error' | 'warning' | 'info') {
  switch (severity) {
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getEffortColor(effort: 'low' | 'medium' | 'high') {
  switch (effort) {
    case 'low':
      return 'text-green-600 bg-green-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'high':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getImpactColor(impact: 'low' | 'medium' | 'high') {
  switch (impact) {
    case 'low':
      return 'text-blue-600 bg-blue-50'
    case 'medium':
      return 'text-purple-600 bg-purple-50'
    case 'high':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'security':
      return '🔒'
    case 'performance':
      return '⚡'
    case 'maintainability':
      return '🔧'
    case 'bug':
      return '🐛'
    case 'style':
      return '🎨'
    default:
      return '📝'
  }
}