import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, ApiError } from '../utils/api';
import '../pages/OngoingQueue.css';

type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

interface ImageOptimizationJob {
  id: number;
  productId: string;
  productName: string;
  status: JobStatus;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  progress: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export default function OngoingImageOptimization() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ImageOptimizationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [displayCount, setDisplayCount] = useState(10);
  const JOBS_PER_PAGE = 10;

  const fetchJobs = async () => {
    try {
      setError(null);
      const response = await fetchWithAuth('/api/image-optimization/jobs');
      setJobs(response.jobs || []);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load jobs');
      }
      setLoading(false);
    }
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/image-optimization/${jobId}`);
  };

  useEffect(() => {
    fetchJobs();

    // Optimized auto-refresh
    let intervalId: NodeJS.Timeout | null = null;

    const setupAutoRefresh = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      const hasPendingJobs = jobs.some(
        job => job.status === 'PENDING' || job.status === 'RUNNING'
      );

      if (hasPendingJobs) {
        intervalId = setInterval(() => {
          fetchJobs();
        }, 5000);
      } else if (jobs.length > 0) {
        intervalId = setInterval(() => {
          fetchJobs();
        }, 30000);
      }
    };

    setupAutoRefresh();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobs]);

  const stats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'RUNNING' || j.status === 'PENDING').length,
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
      PENDING: { label: 'Pending', className: 'status-pending' },
      RUNNING: { label: 'Running', className: 'status-running' },
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
      {/* Status Updates Banner */}
      <div className="status-banner">
        <div className="status-banner-header">
          <span className="info-icon">ℹ️</span>
          <strong>Status updates</strong>
        </div>
        <p className="status-banner-text">
          Showing ongoing and completed image optimization jobs. Active jobs refresh every 5 seconds.
        </p>
      </div>

      {/* Queue Statistics */}
      <div className="stats-card">
        <div className="stats-header">
          <h2>Image Optimization Statistics</h2>
          <div className="stats-actions">
            <button className="btn-primary" onClick={() => navigate('/image-optimization')}>
              Start new optimization
            </button>
            <button className="btn-secondary" onClick={() => navigate('/completed-image-optimization')}>
              View completed jobs
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Total jobs</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">In progress</div>
            <div className="stat-value">{stats.inProgress}</div>
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

      {/* Recent Optimizations */}
      <div className="recent-section">
        <div className="recent-header">
          <h2>Recent optimizations ({displayedJobs.length} of {jobs.length})</h2>
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
            <h3>Loading optimizations...</h3>
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
            <div className="empty-icon">🖼️</div>
            <h3>No image optimization jobs yet</h3>
            <p>Start an optimization to see progress here.</p>
            <button className="btn-primary" onClick={() => navigate('/image-optimization')}>
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
                      {job.productName} • {job.totalImages} images • {formatTime(job.createdAt)}
                    </span>
                  </div>
                  <div className="job-actions">
                    {getStatusBadge(job.status)}
                    {job.status === 'DONE' && (
                      <button 
                        className="btn-view-publish"
                        onClick={() => handleViewJob(job.id)}
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>

                {job.status === 'RUNNING' && (
                  <div className="progress-section">
                    <div className="progress-info">
                      <span>{job.completedImages} / {job.totalImages} images completed</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {job.status === 'PENDING' && (
                  <div className="pending-info">
                    <span>⏳ Waiting to start • {job.totalImages} images queued</span>
                  </div>
                )}

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
