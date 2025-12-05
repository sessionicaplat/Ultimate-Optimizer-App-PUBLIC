import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import './ManageBlogs.css';

interface BlogGeneration {
  id: number;
  status: string;
  blog_title?: string;
  blog_content?: string;
  blog_image_url?: string;
  draft_post_id?: string;
  published_post_id?: string;
  created_at: string;
  finished_at?: string;
}

export default function ManageBlogs() {
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<BlogGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [previewGeneration, setPreviewGeneration] = useState<BlogGeneration | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, [filter]);

  const fetchGenerations = async () => {
    setLoading(true);
    try {
      const statusParam = filter === 'completed' ? '?status=DONE' : filter === 'pending' ? '?status=PENDING,GENERATING_IDEAS,GENERATING_CONTENT,GENERATING_IMAGE,PUBLISHING' : '';
      const data = await fetchWithAuth(`/api/blog-generation${statusParam}`);
      setGenerations(data.generations || []);
    } catch (err: any) {
      console.error('Error fetching generations:', err);
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'status-pending' },
      GENERATING_IDEAS: { label: 'Generating Ideas', className: 'status-progress' },
      GENERATING_CONTENT: { label: 'Writing Content', className: 'status-progress' },
      GENERATING_IMAGE: { label: 'Creating Image', className: 'status-progress' },
      PUBLISHING: { label: 'Publishing', className: 'status-progress' },
      DONE: { label: 'Completed', className: 'status-completed' },
      FAILED: { label: 'Failed', className: 'status-failed' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'status-pending' };

    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredGenerations = generations;

  const openPreview = (generation: BlogGeneration) => {
    setPreviewGeneration(generation);
  };

  const closePreview = () => {
    setPreviewGeneration(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Manage Blogs</h1>
          <p className="subtitle">View and manage your generated blog posts</p>
        </div>
        <div className="header-action">
          <button
            className="create-button"
            onClick={() => navigate('/blog-generator')}
          >
            + Create new blog
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          In Progress
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading blog generations...</div>
      ) : filteredGenerations.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📝</div>
          <h3>No blog posts yet</h3>
          <p>Create your first AI-generated blog post to get started</p>
          <button
            className="create-button"
            onClick={() => navigate('/blog-generator')}
          >
            Create new blog
          </button>
        </div>
      ) : (
        <div className="blogs-grid">
          {filteredGenerations.map((generation) => (
            <div key={generation.id} className="blog-card">
              {generation.blog_image_url && (
                <img
                  src={generation.blog_image_url}
                  alt={generation.blog_title || 'Blog post'}
                  className="blog-card-image"
                />
              )}
              <div className="blog-card-content">
                <div className="blog-card-header">
                  <h3>{generation.blog_title || 'Untitled Blog Post'}</h3>
                  {getStatusBadge(generation.status)}
                </div>
                <p className="blog-card-date">
                  Created: {formatDate(generation.created_at)}
                </p>
                {generation.finished_at && (
                  <p className="blog-card-date">
                    Completed: {formatDate(generation.finished_at)}
                  </p>
                )}

                {generation.status === 'DONE' && (
                  <div className="draft-notice">
                    <strong>Blog added to Drafts.</strong> Open your Wix Blog drafts from the Wix dashboard to publish this post live.
                  </div>
                )}

                <div className="blog-card-actions">
                  {generation.status === 'DONE' && (
                    <button
                      className="view-button"
                      onClick={() => openPreview(generation)}
                    >
                      Preview blog
                    </button>
                  )}
                  {['PENDING', 'GENERATING_IDEAS', 'GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING'].includes(generation.status) && (
                    <button
                      className="view-button"
                      onClick={() => navigate(`/blog-generation/${generation.id}`)}
                    >
                      View Progress
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewGeneration && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div>
                <p className="preview-status">Draft preview</p>
                <h2>{previewGeneration.blog_title || 'Untitled Blog Post'}</h2>
              </div>
              <button className="preview-close" onClick={closePreview} aria-label="Close preview">
                ×
              </button>
            </div>
            {previewGeneration.blog_image_url && (
              <img
                src={previewGeneration.blog_image_url}
                alt={previewGeneration.blog_title || 'Blog post preview'}
                className="preview-hero-image"
              />
            )}
            <div className="preview-body">
              {previewGeneration.blog_content ? (
                <div
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: previewGeneration.blog_content }}
                />
              ) : (
                <p className="muted">Blog content is not available yet.</p>
              )}
            </div>
            <div className="preview-footer muted">
              Blog added to Drafts. Publish it from your Wix dashboard when you're ready to go live.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
