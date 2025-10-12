import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Prism from '../components/ui/prism';
import { supabase } from '../lib/supabase';
import styles from './Dashboard.module.css';

interface Repository {
  id: string;
  name: string;
  url: string;
  provider: string;
}

interface PullRequest {
  id: string;
  pr_number: number;
  title: string;
  author: string;
  status: string;
  created_at: string;
  repository?: Repository;
}

export default function Dashboard() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [repoForm, setRepoForm] = useState({ name: '', url: '', provider: 'github' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPullRequests();
  }, []);

  const fetchPullRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pull_requests')
        .select(`
          *,
          repository:repositories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPullRequests(data || []);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .insert([repoForm])
        .select()
        .single();

      if (repoError) throw repoError;

      const { error: prError } = await supabase
        .from('pull_requests')
        .insert([
          {
            repository_id: repo.id,
            pr_number: 1,
            title: 'Initial Pull Request',
            description: 'Demo pull request for code review',
            author: 'demo-user',
            status: 'open',
            branch_source: 'feature/demo',
            branch_target: 'main',
          },
        ]);

      if (prError) throw prError;

      setShowAddRepo(false);
      setRepoForm({ name: '', url: '', provider: 'github' });
      fetchPullRequests();
    } catch (error) {
      console.error('Error adding repository:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#4ade80';
      case 'closed':
        return '#ef4444';
      case 'merged':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

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
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>PullWise</h1>
              <p className={styles.subtitle}>AI-Powered Code Review Platform</p>
            </div>
            <button className={styles.addButton} onClick={() => setShowAddRepo(true)}>
              + Add Repository
            </button>
          </div>
        </header>

        <main className={styles.main}>
          {showAddRepo && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Add Repository</h2>
                <form onSubmit={addRepository} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Repository Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={repoForm.name}
                      onChange={(e) => setRepoForm({ ...repoForm, name: e.target.value })}
                      required
                      placeholder="my-awesome-project"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Repository URL</label>
                    <input
                      type="url"
                      className={styles.input}
                      value={repoForm.url}
                      onChange={(e) => setRepoForm({ ...repoForm, url: e.target.value })}
                      required
                      placeholder="https://github.com/user/repo"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Provider</label>
                    <select
                      className={styles.select}
                      value={repoForm.provider}
                      onChange={(e) => setRepoForm({ ...repoForm, provider: e.target.value })}
                    >
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                    </select>
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowAddRepo(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Add Repository
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={styles.cardGrid}>
            {loading ? (
              <div className={styles.loading}>Loading pull requests...</div>
            ) : pullRequests.length === 0 ? (
              <div className={styles.empty}>
                <p>No pull requests found. Add a repository to get started.</p>
              </div>
            ) : (
              pullRequests.map((pr) => (
                <div key={pr.id} className={styles.card} onClick={() => navigate(`/pr/${pr.id}`)}>
                  <div className={styles.cardHeader}>
                    <div className={styles.prNumber}>#{pr.pr_number}</div>
                    <div className={styles.status} style={{ background: getStatusColor(pr.status) }}>
                      {pr.status}
                    </div>
                  </div>
                  <h3 className={styles.cardTitle}>{pr.title}</h3>
                  <div className={styles.cardMeta}>
                    <span className={styles.author}>{pr.author}</span>
                    <span className={styles.repo}>{pr.repository?.name || 'Unknown'}</span>
                  </div>
                  <div className={styles.cardDate}>
                    {new Date(pr.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
