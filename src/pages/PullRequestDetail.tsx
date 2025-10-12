import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Prism from '../components/ui/prism';
import { supabase } from '../lib/supabase';
import CodeAnalyzer from '../components/CodeAnalyzer';
import ReviewResults from '../components/ReviewResults';
import styles from './PullRequestDetail.module.css';

interface PullRequest {
  id: string;
  pr_number: number;
  title: string;
  description: string;
  author: string;
  status: string;
  branch_source: string;
  branch_target: string;
  created_at: string;
  repository?: {
    name: string;
    provider: string;
  };
}

interface CodeReview {
  id: string;
  analysis_type: string;
  severity: string;
  status: string;
  summary: string;
  created_at: string;
}

export default function PullRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analyze' | 'reviews'>('overview');

  useEffect(() => {
    if (id) {
      fetchPullRequest();
      fetchReviews();
    }
  }, [id]);

  const fetchPullRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('pull_requests')
        .select(`
          *,
          repository:repositories(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPullRequest(data);
    } catch (error) {
      console.error('Error fetching pull request:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('code_reviews')
        .select('*')
        .eq('pull_request_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!pullRequest) {
    return (
      <div className={styles.container}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
        <div className={styles.error}>Pull request not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Prism
        animationType="rotate"
        timeScale={0.5}
        height={3.5}
        baseWidth={5.5}
        scale={3.6}
        hueShift={0}
        colorFrequency={1}
        noise={0.5}
        glow={1}
      />

      <div className={styles.content}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className={styles.headerInfo}>
            <div className={styles.prHeader}>
              <span className={styles.prNumber}>#{pullRequest.pr_number}</span>
              <h1 className={styles.title}>{pullRequest.title}</h1>
            </div>
            <div className={styles.meta}>
              <span className={styles.author}>{pullRequest.author}</span>
              <span className={styles.branches}>
                {pullRequest.branch_source} → {pullRequest.branch_target}
              </span>
              <span className={styles.repo}>{pullRequest.repository?.name}</span>
            </div>
          </div>
        </header>

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'analyze' ? styles.active : ''}`}
            onClick={() => setActiveTab('analyze')}
          >
            Analyze Code
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.active : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </nav>

        <main className={styles.main}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Description</h2>
                <p className={styles.description}>
                  {pullRequest.description || 'No description provided.'}
                </p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Details</h2>
                <div className={styles.details}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>{pullRequest.status}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>
                      {new Date(pullRequest.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Provider</span>
                    <span className={styles.detailValue}>{pullRequest.repository?.provider}</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'analyze' && (
            <CodeAnalyzer pullRequestId={pullRequest.id} onReviewComplete={fetchReviews} />
          )}

          {activeTab === 'reviews' && (
            <ReviewResults reviews={reviews} />
          )}
        </main>
      </div>
    </div>
  );
}
