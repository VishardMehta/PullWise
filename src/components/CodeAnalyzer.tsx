import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './CodeAnalyzer.module.css';

interface CodeAnalyzerProps {
  pullRequestId: string;
  onReviewComplete: () => void;
}

interface Issue {
  line_number: number;
  issue_type: string;
  severity: string;
  description: string;
  suggestion: string;
  code_snippet: string;
}

export default function CodeAnalyzer({ pullRequestId, onReviewComplete }: CodeAnalyzerProps) {
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState('example.js');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ summary: string; issues: Issue[] } | null>(null);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-code`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, fileName }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setResult(data.analysis);

        const { data: review, error: reviewError } = await supabase
          .from('code_reviews')
          .insert([
            {
              pull_request_id: pullRequestId,
              analysis_type: data.analysisType,
              severity: data.analysis.issues.length > 0 ? 'warning' : 'info',
              status: 'completed',
              summary: data.analysis.summary,
            },
          ])
          .select()
          .single();

        if (reviewError) throw reviewError;

        if (data.analysis.issues.length > 0) {
          const issuesData = data.analysis.issues.map((issue: Issue) => ({
            review_id: review.id,
            file_path: fileName,
            line_number: issue.line_number,
            issue_type: issue.issue_type,
            severity: issue.severity,
            description: issue.description,
            suggestion: issue.suggestion,
            code_snippet: issue.code_snippet,
          }));

          const { error: issuesError } = await supabase.from('issues').insert(issuesData);
          if (issuesError) throw issuesError;
        }

        onReviewComplete();
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing code:', error);
      alert('Failed to analyze code. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'error':
        return '#f97316';
      case 'warning':
        return '#eab308';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <div className={styles.inputHeader}>
          <input
            type="text"
            className={styles.fileNameInput}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="filename.js"
          />
          <button
            className={styles.analyzeButton}
            onClick={analyzeCode}
            disabled={analyzing || !code.trim()}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Code'}
          </button>
        </div>
        <textarea
          className={styles.codeInput}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here for AI-powered analysis..."
          rows={20}
        />
      </div>

      {result && (
        <div className={styles.results}>
          <div className={styles.summary}>
            <h3 className={styles.resultsTitle}>Analysis Summary</h3>
            <p className={styles.summaryText}>{result.summary}</p>
          </div>

          {result.issues.length > 0 ? (
            <div className={styles.issues}>
              <h3 className={styles.resultsTitle}>Issues Found ({result.issues.length})</h3>
              {result.issues.map((issue, index) => (
                <div key={index} className={styles.issue}>
                  <div className={styles.issueHeader}>
                    <div className={styles.issueHeaderLeft}>
                      <span
                        className={styles.severity}
                        style={{ background: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                      <span className={styles.issueType}>{issue.issue_type}</span>
                      <span className={styles.lineNumber}>Line {issue.line_number}</span>
                    </div>
                  </div>
                  <p className={styles.issueDescription}>{issue.description}</p>
                  {issue.code_snippet && (
                    <pre className={styles.codeSnippet}>
                      <code>{issue.code_snippet}</code>
                    </pre>
                  )}
                  {issue.suggestion && (
                    <div className={styles.suggestion}>
                      <strong>Suggestion:</strong> {issue.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noIssues}>
              No issues found. Code looks good!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
