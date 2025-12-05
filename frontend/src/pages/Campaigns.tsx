import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import './Campaigns.css';

interface Campaign {
  id: number;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  created_at: string;
  total_blogs?: number;
  scheduled_count?: number;
  completed_count?: number;
  failed_count?: number;
}

interface ScheduledBlog {
  id: number;
  campaign_id: number;
  source_type: string;
  scheduled_date: string;
  status: string;
  blog_idea?: any;
  error?: string;
  blog_generation_id?: number;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [scheduledBlogs, setScheduledBlogs] = useState<Record<number, ScheduledBlog[]>>({});

  useEffect(() => {
    fetchCampaigns();
  }, [activeTab]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const includeArchived = activeTab === 'archived';
      const data = await fetchWithAuth(`/api/campaigns?archived=${includeArchived}`);
      
      const filteredCampaigns = activeTab === 'archived'
        ? data.campaigns.filter((c: Campaign) => c.status === 'ARCHIVED')
        : data.campaigns.filter((c: Campaign) => c.status !== 'ARCHIVED');
      
      setCampaigns(filteredCampaigns);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledBlogs = async (campaignId: number) => {
    try {
      const data = await fetchWithAuth(`/api/campaigns/${campaignId}/scheduled-blogs`);
      setScheduledBlogs((prev) => ({
        ...prev,
        [campaignId]: data.scheduledBlogs || [],
      }));
    } catch (err: any) {
      console.error('Error fetching scheduled blogs:', err);
    }
  };

  const handleToggleExpand = (campaignId: number) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      if (!scheduledBlogs[campaignId]) {
        fetchScheduledBlogs(campaignId);
      }
    }
  };

  const handleArchiveCampaign = async (campaignId: number) => {
    if (!confirm('Archive this campaign? You can restore it later from the Archived tab.')) {
      return;
    }

    try {
      await fetchWithAuth(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error archiving campaign:', err);
      alert(err.message || 'Failed to archive campaign');
    }
  };

  const handleRestoreCampaign = async (campaignId: number) => {
    try {
      await fetchWithAuth(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error restoring campaign:', err);
      alert(err.message || 'Failed to restore campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm('Permanently delete this campaign? This cannot be undone.')) {
      return;
    }

    try {
      await fetchWithAuth(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      alert(err.message || 'Failed to delete campaign');
    }
  };

  const handleRemoveScheduledBlog = async (blogId: number, campaignId: number) => {
    if (!confirm('Remove this scheduled blog?')) {
      return;
    }

    try {
      await fetchWithAuth(`/api/scheduled-blogs/${blogId}`, {
        method: 'DELETE',
      });
      fetchScheduledBlogs(campaignId);
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error removing scheduled blog:', err);
      alert(err.message || 'Failed to remove scheduled blog');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Manage scheduled campaigns</h1>
          <p className="subtitle">
            Review upcoming posts, adjust their publish time, or remove blogs before they go live.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/blog-scheduler')}>
            Create Campaign
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="campaigns-tabs">
        <button
          className={activeTab === 'active' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('active')}
        >
          Active Campaigns
        </button>
        <button
          className={activeTab === 'archived' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('archived')}
        >
          Archived Campaigns
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <p>
            {activeTab === 'active'
              ? 'No active campaigns yet. Create your first campaign to get started.'
              : 'No archived campaigns.'}
          </p>
          {activeTab === 'active' && (
            <button className="btn-primary" onClick={() => navigate('/blog-scheduler')}>
              Create Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header" onClick={() => handleToggleExpand(campaign.id)}>
                <div className="campaign-info">
                  <h3>{campaign.name}</h3>
                  <div className="campaign-stats">
                    <span className="stat">
                      {campaign.scheduled_count || 0} scheduled
                    </span>
                    <span className="stat">
                      {campaign.completed_count || 0} completed
                    </span>
                    {(campaign.failed_count || 0) > 0 && (
                      <span className="stat error">
                        {campaign.failed_count} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="campaign-actions">
                  {activeTab === 'active' ? (
                    <button
                      className="btn-archive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveCampaign(campaign.id);
                      }}
                    >
                      Archive
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-restore"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreCampaign(campaign.id);
                        }}
                      >
                        Restore
                      </button>
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCampaign(campaign.id);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <span className={`expand-arrow ${expandedCampaign === campaign.id ? 'open' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedCampaign === campaign.id && (
                <div className="campaign-details">
                  {!scheduledBlogs[campaign.id] ? (
                    <div className="loading-state-small">Loading scheduled blogs...</div>
                  ) : scheduledBlogs[campaign.id].length === 0 ? (
                    <div className="empty-state-small">No scheduled blogs in this campaign</div>
                  ) : (
                    <div className="scheduled-blogs-list">
                      {scheduledBlogs[campaign.id].map((blog) => (
                        <div key={blog.id} className="scheduled-blog-item">
                          <div className="blog-info">
                            <h4>{blog.blog_idea?.title || 'Untitled Blog'}</h4>
                            <p className="blog-meta">
                              <span className={`status-badge ${blog.status.toLowerCase()}`}>
                                {blog.status}
                              </span>
                              <span className="blog-date">
                                {new Date(blog.scheduled_date).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                  hour12: true
                                })}
                              </span>
                            </p>
                            {blog.error && (
                              <p className="blog-error">{blog.error}</p>
                            )}
                          </div>
                          {blog.status === 'COMPLETED' && blog.blog_generation_id && (
                            <button
                              className="btn-view-blog"
                              onClick={() => navigate(`/blog-generation/${blog.blog_generation_id}`)}
                            >
                              View Blog
                            </button>
                          )}
                          {blog.status === 'SCHEDULED' && activeTab === 'active' && (
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveScheduledBlog(blog.id, campaign.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
