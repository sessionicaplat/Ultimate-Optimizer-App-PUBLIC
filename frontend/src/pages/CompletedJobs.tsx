import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, ApiError } from '../utils/api';
import './OngoingQueue.css';

type JobStatus = 'DONE' | 'FAILED';

interface Job {
  id: number;
  status: JobStatus;
  sourceScope: string;
  productCount: number;
  attributeCount: number;
  totalItems: number;
  completedItems: number;
  publishedItems?: number;
  progress: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export default function CompletedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [displayCount, setDisplayCount] = useState(10);
  const JOBS_PER_PAGE = 10;

  const fetchJobs = async () => {
    try {
      setError(null);
      // Fetch jobs with DONE or FAILED status
      const [doneResponse, failedResponse] = await Promise.all([
        fetchWithAuth('/api/jobs?status=DONE'),
        fetchWithAuth('/api/jobs?status=FAILED'),
      ]);
      
      const allJobs = [...doneResponse.jobs, ...failedResponse.jobs];
      // Sort by finished date, most recent first
      allJobs.sort((a, b) => {
        const dateA = new Date(a.finishedAt || a.createdAt).getTime();
        const dateB = new Date(b.finishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setJobs(allJobs);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load completed jobs');
      }
      setLoading(false);
    }
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/job/${jobId}`);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'DONE').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
  };

  const displayedJobs = jobs.slice(0, displayCount);
  const hasMoreJobs = jobs.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + JOBS_PER_PAGE);
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const getStatusBadge = (status: JobStatus) => {
    const badges = {
      DONE: { label: 'Done', className: 'status-done' },
      FAILED: { label: 'Failed', className: 'status-failed' },
    };
    const badge = badges[status];
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-container">
      {/* Queue Statistics */}
      <div className="stats-card">
        <div className="stats-header">
          <h2>Completed Jobs Statistics</h2>
          <div className="stats-actions">
            <button className="btn-primary" onClick={() => navigate('/optimizer')}>
              Start new optimization
            </button>
            <button className="btn-secondary" onClick={() => navigate('/queue')}>
              View ongoing jobs
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Total jobs</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Failed</div>
            <div className="stat-value">{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* Completed Optimizations */}
      <div className="recent-section">
        <div className="recent-header">
          <h2>Completed optimizations ({displayedJobs.length} of {jobs.length})</h2>
          <div className="recent-actions">
            <span className="update-time">Updated {formatLastUpdate()}</span>
            <button className="btn-refresh" onClick={fetchJobs}>
              Refresh
            </button>
          </div>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">⏳</div>
            <h3>Loading completed jobs...</h3>
          </div>
        ) : error ? (
          <div className="empty-state-card error">
            <div className="empty-icon">⚠️</div>
            <h3>Failed to load jobs</h3>
            <p>{error}</p>
            <button onClick={fetchJobs} className="btn-primary">Retry</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📦</div>
            <h3>No completed jobs yet</h3>
            <p>Start an optimization to see completed jobs here.</p>
            <button className="btn-primary" onClick={() => navigate('/optimizer')}>
              Start new optimization
            </button>
          </div>
        ) : (
          <div className="jobs-list">
            {displayedJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <div className="job-info">
                    <h3>Job #{job.id}</h3>
                    <span className="job-meta">
                      {job.sourceScope} • {job.totalItems} items • {formatTime(job.finishedAt || job.createdAt)}
                    </span>
                  </div>
                  <div className="job-actions">
                    {getStatusBadge(job.status)}
                    {job.status === 'DONE' && (
                      <button 
                        className="btn-view-publish"
                        onClick={() => handleViewJob(job.id)}
                      >
                        {job.publishedItems === job.completedItems ? 'View details' : 'View & Publish'}
                      </button>
                    )}
                  </div>
                </div>

                {job.status === 'FAILED' && job.error && (
                  <div className="error-info">
                    <span>❌ {job.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMoreJobs && (
          <div className="load-more-section">
            <button className="btn-load-more" onClick={handleLoadMore}>
              Load more ({jobs.length - displayCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
