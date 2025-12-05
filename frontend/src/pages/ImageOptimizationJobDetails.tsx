import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth, ApiError } from '../utils/api';
import './JobDetails.css';

interface ImageOptimizationItem {
  id: number;
  jobId: number;
  imageId: string;
  imageUrl: string;
  optimizedImageUrl?: string;
  prompt: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  error?: string;
  published?: boolean;
}

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

export default function ImageOptimizationJobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<ImageOptimizationJob | null>(null);
  const [items, setItems] = useState<ImageOptimizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingItems, setPublishingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setError(null);
      const response = await fetchWithAuth(`/api/image-optimization/jobs/${jobId}`);
      setJob(response.job);
      setItems(response.items || []);
      setLoading(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load job details');
      }
      setLoading(false);
    }
  };

  const handlePublishImage = async (itemId: number) => {
    setPublishingItems(prev => new Set(prev).add(itemId));

    try {
      await fetchWithAuth(`/api/image-optimization/publish/${itemId}`, {
        method: 'POST',
      });

      // Update the item as published
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, published: true } : item
        )
      );
    } catch (err: any) {
      console.error('Failed to publish image:', err);
      alert(`Failed to publish image: ${err.message || 'Please try again.'}`);
    } finally {
      setPublishingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const stats = {
    total: items.length,
    completed: items.filter(i => i.status === 'DONE').length,
    failed: items.filter(i => i.status === 'FAILED').length,
    published: items.filter(i => i.published).length,
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="page-container">
        <div className="error-state">
          <p>{error || 'Job not found'}</p>
          <button onClick={() => navigate('/ongoing-image-optimization')} className="btn-back">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container job-details-page">
      {/* Header */}
      <div className="job-details-header">
        <div className="header-left">
          <button className="btn-back-arrow" onClick={() => navigate('/ongoing-image-optimization')}>
            ← Back
          </button>
          <div>
            <h1>Image Optimization Results</h1>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-container">
        <div className="stat-box">
          <div className="stat-label">Product</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>{job.productName}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Images</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.completed}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats.published}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar-full">
          <div className="progress-fill-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Image Results */}
      <div className="products-section">
        {items.map((item, index) => (
          <div key={item.id} className="product-item-card">
            <div className="product-item-header">
              <div className="product-item-info">
                <span className="product-number">#{index + 1}</span>
              </div>
              <div className="product-item-actions">
                {item.status === 'DONE' && !item.published && (
                  <button
                    className="btn-publish-item"
                    onClick={() => handlePublishImage(item.id)}
                    disabled={publishingItems.has(item.id)}
                  >
                    {publishingItems.has(item.id) ? 'Publishing...' : 'Publish'}
                  </button>
                )}
                {item.published && (
                  <button className="btn-published" disabled>
                    Published
                  </button>
                )}
                {item.status === 'FAILED' && (
                  <span className="status-badge status-failed">Failed</span>
                )}
              </div>
            </div>

            {item.status === 'DONE' && (
              <div className="product-item-content">
                <div className="field-section">
                  <h4>Prompt: {item.prompt}</h4>
                  <div className="before-after-grid">
                    <div className="before-column">
                      <h5>Original</h5>
                      <div className="content-box">
                        <img 
                          src={item.imageUrl} 
                          alt="Original" 
                          style={{ width: '100%', borderRadius: '6px' }}
                        />
                      </div>
                    </div>
                    <div className="after-column">
                      <h5>Optimized</h5>
                      <div className="content-box">
                        {item.optimizedImageUrl ? (
                          <img 
                            src={item.optimizedImageUrl} 
                            alt="Optimized" 
                            style={{ width: '100%', borderRadius: '6px' }}
                          />
                        ) : (
                          <p>No optimized image available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {item.status === 'FAILED' && item.error && (
              <div className="product-item-content">
                <div className="error-info">
                  <span>❌ {item.error}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
