import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './ReviewResults.module.css';

interface Review {
  id: string;
  analysis_type: string;
  severity: string;
  status: string;
  summary: string;
  created_at: string;
}

interface Issue {
  id: string;
  file_path: string;
  line_number: number;
  issue_type: string;
  severity: string;
  description: string;
  suggestion: string;
  code_snippet: string;
  created_at: string;
}

interface ReviewResultsProps {
  reviews: Review[];
}

export default function ReviewResults({ reviews }: ReviewResultsProps) {
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    if (reviews.length > 0 && !selectedReview) {
      setSelectedReview(reviews[0].id);
    }
  }, [reviews]);

  useEffect(() => {
    if (selectedReview) {
      fetchIssues(selectedReview);
    }
  }, [selectedReview]);

  const fetchIssues = async (reviewId: string) => {
    setLoadingIssues(true);
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('review_id', reviewId)
        .order('severity', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoadingIssues(false);
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

  if (reviews.length === 0) {
    return (
      <div className={styles.empty}>
        No reviews yet. Use the "Analyze Code" tab to create your first review.
      </div>
    );
  }

  const currentReview = reviews.find((r) => r.id === selectedReview);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Reviews</h3>
        {reviews.map((review) => (
          <button
            key={review.id}
            className={`${styles.reviewItem} ${selectedReview === review.id ? styles.active : ''}`}
            onClick={() => setSelectedReview(review.id)}
          >
            <div className={styles.reviewItemHeader}>
              <span
                className={styles.severity}
                style={{ background: getSeverityColor(review.severity) }}
              >
                {review.severity}
              </span>
              <span className={styles.analysisType}>{review.analysis_type}</span>
            </div>
            <div className={styles.reviewDate}>
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {currentReview && (
          <>
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Summary</h3>
              <p className={styles.summaryText}>{currentReview.summary}</p>
              <div className={styles.summaryMeta}>
                <span className={styles.metaItem}>
                  Status: <strong>{currentReview.status}</strong>
                </span>
                <span className={styles.metaItem}>
                  Type: <strong>{currentReview.analysis_type}</strong>
                </span>
                <span className={styles.metaItem}>
                  Date: <strong>{new Date(currentReview.created_at).toLocaleDateString()}</strong>
                </span>
              </div>
            </div>

            {loadingIssues ? (
              <div className={styles.loading}>Loading issues...</div>
            ) : issues.length > 0 ? (
              <div className={styles.issues}>
                <h3 className={styles.issuesTitle}>Issues ({issues.length})</h3>
                {issues.map((issue) => (
                  <div key={issue.id} className={styles.issue}>
                    <div className={styles.issueHeader}>
                      <div className={styles.issueHeaderLeft}>
                        <span
                          className={styles.issueSeverity}
                          style={{ background: getSeverityColor(issue.severity) }}
                        >
                          {issue.severity}
                        </span>
                        <span className={styles.issueType}>{issue.issue_type}</span>
                      </div>
                      <div className={styles.issueLocation}>
                        <span className={styles.filePath}>{issue.file_path}</span>
                        <span className={styles.lineNumber}>:{issue.line_number}</span>
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
              <div className={styles.noIssues}>No issues found in this review.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
