import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, ApiError } from '../utils/api';
import '../pages/OngoingQueue.css';

interface ImageOptimizationJob {
  id: number;
  productId: string;
  productName: string;
  status: string;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  createdAt: string;
  finishedAt?: string;
}

export default function CompletedImageOptimization() {
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
      const response = await fetchWithAuth('/api/image-optimization/jobs?status=DONE');
      setJobs(response.jobs || []);
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
    navigate(`/image-optimization/${jobId}`);
  };

  useEffect(() => {
    fetchJobs();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchJobs();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const stats = {
    total: jobs.length,
    totalImages: jobs.reduce((sum, job) => sum + job.completedImages, 0),
    totalFailed: jobs.reduce((sum, job) => sum + job.failedImages, 0),
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
          <strong>Completed Jobs</strong>
        </div>
        <p className="status-banner-text">
          View all completed image optimization jobs. Page refreshes every 30 seconds.
        </p>
      </div>

      {/* Statistics */}
      <div className="stats-card">
        <div className="stats-header">
          <h2>Completed Image Optimizations</h2>
          <div className="stats-actions">
            <button className="btn-primary" onClick={() => navigate('/image-optimization')}>
              Start new optimization
            </button>
            <button className="btn-secondary" onClick={() => navigate('/ongoing-image-optimization')}>
              View Ongoing Image Optimizations
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Total jobs</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Images optimized</div>
            <div className="stat-value">{stats.totalImages}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Failed images</div>
            <div className="stat-value">{stats.totalFailed}</div>
          </div>
        </div>
      </div>

      {/* Completed Jobs List */}
      <div className="recent-section">
        <div className="recent-header">
          <h2>Completed jobs ({displayedJobs.length} of {jobs.length})</h2>
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
            <div className="empty-icon">🖼️</div>
            <h3>No completed image optimization jobs yet</h3>
            <p>Start an optimization to see completed jobs here.</p>
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
                      {job.productName} • {job.completedImages} images optimized • {formatTime(job.finishedAt || job.createdAt)}
                    </span>
                  </div>
                  <div className="job-actions">
                    <span className="status-badge status-done">Completed</span>
                    <button 
                      className="btn-view-publish"
                      onClick={() => handleViewJob(job.id)}
                    >
                      View Results
                    </button>
                  </div>
                </div>

                {job.failedImages > 0 && (
                  <div className="error-info">
                    <span>⚠️ {job.failedImages} image(s) failed to optimize</span>
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
