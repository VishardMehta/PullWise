import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisHistory {
  id: string;
  repository_owner: string;
  repository_name: string;
  pr_number: number;
  pr_title: string;
  code_quality_score: number;
  ml_impact_score: number;
  risk_level: string;
  analyzed_at: string;
  files_changed: number;
  additions: number;
  deletions: number;
  code_analysis_result: any;
  ml_analysis_result: any;
}

interface TrendData {
  date: string;
  codeQuality: number;
  mlImpact: number;
  count: number;
}

interface IssueTypeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export function TrendsView() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedRepo, setSelectedRepo] = useState<string>('all');

  useEffect(() => {
    fetchAnalysisHistory();
  }, [timeRange, selectedRepo]);

  const fetchAnalysisHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      let query = supabase
        .from('pr_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('analyzed_at', daysAgo.toISOString())
        .order('analyzed_at', { ascending: false });

      if (selectedRepo !== 'all') {
        const [owner, name] = selectedRepo.split('/');
        query = query.eq('repository_owner', owner).eq('repository_name', name);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for Code Quality Trend (Line Chart)
  const getQualityTrendData = (): TrendData[] => {
    const grouped = history.reduce((acc, item) => {
      const date = new Date(item.analyzed_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { codeQuality: [], mlImpact: [] };
      }
      if (item.code_quality_score) acc[date].codeQuality.push(item.code_quality_score);
      if (item.ml_impact_score) acc[date].mlImpact.push(item.ml_impact_score);
      return acc;
    }, {} as Record<string, { codeQuality: number[], mlImpact: number[] }>);

    return Object.entries(grouped)
      .map(([date, scores]) => ({
        date,
        codeQuality: Math.round(scores.codeQuality.reduce((a, b) => a + b, 0) / scores.codeQuality.length),
        mlImpact: Math.round(scores.mlImpact.reduce((a, b) => a + b, 0) / scores.mlImpact.length),
        count: scores.codeQuality.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 data points
  };

  // Process data for Analysis Count (Bar Chart)
  const getAnalysisCountData = () => {
    const grouped = history.reduce((acc, item) => {
      const date = new Date(item.analyzed_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);
  };

  // Process data for Issue Types (Pie Chart)
  const getIssueTypeData = (): IssueTypeData[] => {
    const issueTypes: Record<string, number> = {};
    
    history.forEach(item => {
      if (item.code_analysis_result?.issues) {
        item.code_analysis_result.issues.forEach((issue: any) => {
          const type = issue.type || issue.category || 'Other';
          issueTypes[type] = (issueTypes[type] || 0) + 1;
        });
      }
    });

    return Object.entries(issueTypes)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 issue types
  };

  // Process data for Risk Levels Over Time (Area Chart)
  const getRiskTrendData = () => {
    const grouped = history.reduce((acc, item) => {
      const date = new Date(item.analyzed_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { low: 0, medium: 0, high: 0 };
      }
      const risk = item.risk_level?.toLowerCase() || 'low';
      if (risk === 'low' || risk === 'medium' || risk === 'high') {
        acc[date][risk]++;
      }
      return acc;
    }, {} as Record<string, { low: number, medium: number, high: number }>);

    return Object.entries(grouped)
      .map(([date, risks]) => ({ date, ...risks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);
  };

  // Get unique repositories
  const getRepositories = () => {
    const repos = new Set(
      history.map(item => `${item.repository_owner}/${item.repository_name}`)
    );
    return Array.from(repos);
  };

  const qualityTrendData = getQualityTrendData();
  const analysisCountData = getAnalysisCountData();
  const issueTypeData = getIssueTypeData();
  const riskTrendData = getRiskTrendData();
  const repositories = getRepositories();

  const avgCodeQuality = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + (item.code_quality_score || 0), 0) / history.length)
    : 0;

  const avgMlImpact = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + (item.ml_impact_score || 0), 0) / history.length)
    : 0;

  const totalIssues = history.reduce((sum, item) => {
    return sum + (item.code_analysis_result?.issues?.length || 0);
  }, 0);

  const highRiskCount = history.filter(item => item.risk_level === 'high').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-white">PR Analysis Trends</h2>
            <p className="text-sm text-white/60">Track your code quality and analysis patterns over time</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-black/80 border-white/10 backdrop-blur-md">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-white/10 rounded w-3/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-white">PR Analysis Trends</h2>
          <p className="text-sm text-white/60">
            {history.length} analyses · Avg Quality: {avgCodeQuality}% · Avg Impact: {avgMlImpact}%
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/10">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="w-[200px] bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="All repositories" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/10">
              <SelectItem value="all">All repositories</SelectItem>
              {repositories.map(repo => (
                <SelectItem key={repo} value={repo}>{repo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4 Trend Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Code Quality Trend (Line Chart) */}
        <Card className="bg-black/80 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Code Quality Trend</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Average quality scores over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000000dd', 
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line 
                    type="monotone" 
                    dataKey="codeQuality" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Code Quality"
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mlImpact" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="ML Impact"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-white/40">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Analysis Count (Bar Chart) */}
        <Card className="bg-black/80 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-white">Analysis Activity</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Number of PRs analyzed per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisCountData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analysisCountData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000000dd', 
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-white/40">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Top Issues (Pie Chart) */}
        <Card className="bg-black/80 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-white">Top Issue Types</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Distribution of {totalIssues} issues found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {issueTypeData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={issueTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {issueTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000dd', 
                        border: '1px solid #ffffff20',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-2">
                  {issueTypeData.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-black/30 border border-white/10 rounded-lg hover:bg-black/50 transition-colors backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-white text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm">{item.value}</span>
                        <span className="text-white font-semibold text-sm">
                          {((item.value / totalIssues) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-white/40">
                No issues found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Risk Levels Over Time (Area Chart) */}
        <Card className="bg-black/80 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-400" />
              <CardTitle className="text-white">Risk Level Trends</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              {highRiskCount} high-risk PRs analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riskTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#ffffff60" 
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000000dd', 
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Area 
                    type="monotone" 
                    dataKey="high" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    name="High Risk"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="medium" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    name="Medium Risk"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="low" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981"
                    name="Low Risk"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-white/40">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
