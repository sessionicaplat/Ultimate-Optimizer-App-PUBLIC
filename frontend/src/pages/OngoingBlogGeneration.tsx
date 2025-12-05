import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import './OngoingBlogGeneration.css';

interface BlogIdea {
  title: string;
  description: string;
  targetAudience: string;
  hook?: string;
  format?: string;
  keywords?: string[];
}

interface BlogGeneration {
  id: number;
  status: string;
  blog_ideas?: BlogIdea[];
  selected_idea_index?: number;
  blog_title?: string;
  blog_content?: string;
  blog_image_url?: string;
  draft_post_id?: string;
  error?: string;
}

export default function OngoingBlogGeneration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [generation, setGeneration] = useState<BlogGeneration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchGeneration();
    const interval = setInterval(fetchGeneration, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchGeneration = async () => {
    try {
      const data = await fetchWithAuth(`/api/blog-generation/${id}`);
      setGeneration(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching generation:', err);
      setError(err.message || 'Failed to load blog generation');
      setLoading(false);
    }
  };

  const handleRegenerateIdeas = async () => {
    setRegenerating(true);
    setError(null);

    try {
      await fetchWithAuth(`/api/blog-generation/${id}/regenerate-ideas`, {
        method: 'POST',
      });
      
      // Wait a moment then start polling
      setTimeout(fetchGeneration, 1000);
    } catch (err: any) {
      console.error('Error regenerating ideas:', err);
      setError(err.message || 'Failed to regenerate ideas');
    } finally {
      setRegenerating(false);
    }
  };

  const handleGenerateBlogPost = async () => {
    if (selectedIdeaIndex === null) {
      setError('Please select a blog idea');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await fetchWithAuth(`/api/blog-generation/${id}/select-idea`, {
        method: 'POST',
        body: JSON.stringify({ ideaIndex: selectedIdeaIndex }),
      });
      
      // Start polling for updates
      setTimeout(fetchGeneration, 1000);
    } catch (err: any) {
      console.error('Error generating blog post:', err);
      setError(err.message || 'Failed to generate blog post');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading blog generation...</div>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="page-container">
        <div className="error-state">Blog generation not found</div>
      </div>
    );
  }

  // Show ideas selection only if ideas exist, none selected, and status is AWAITING_SELECTION
  if (generation.blog_ideas && generation.blog_ideas.length > 0 && generation.selected_idea_index === null && generation.status === 'AWAITING_SELECTION') {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Select a blog idea</h1>
          <p className="subtitle">Choose one of the generated ideas to create your blog post</p>
        </div>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <div className="ideas-grid">
          {generation.blog_ideas.map((idea, index) => (
            <div
              key={index}
              className={`idea-card ${selectedIdeaIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedIdeaIndex(index)}
            >
              <div className="idea-header">
                <input
                  type="radio"
                  checked={selectedIdeaIndex === index}
                  onChange={() => setSelectedIdeaIndex(index)}
                />
                <h3>{idea.title}</h3>
              </div>
              <p className="idea-description">{idea.description}</p>
              <p className="idea-audience">
                <strong>Target Audience:</strong> {idea.targetAudience}
              </p>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button
            className="secondary-button"
            onClick={handleRegenerateIdeas}
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate ideas'}
          </button>
          <button
            className="primary-button"
            onClick={handleGenerateBlogPost}
            disabled={selectedIdeaIndex === null || generating}
          >
            {generating ? 'Generating...' : 'Generate blog post'}
          </button>
        </div>
      </div>
    );
  }

  // Show progress
  const getStatusMessage = () => {
    const hasPreSelectedIdea = generation.blog_ideas && 
                               generation.blog_ideas.length > 0 && 
                               typeof generation.selected_idea_index === 'number' &&
                               generation.selected_idea_index >= 0;
    
    // Check completion state for accurate messaging
    const hasContent = !!generation.blog_content;
    const hasImage = !!generation.blog_image_url;
    
    if (generation.status === 'DONE') return 'Blog post created successfully!';
    if (generation.status === 'PUBLISHING') return 'Publishing to your blog...';
    if (hasImage && generation.status === 'PENDING') return 'Preparing to publish...';
    if (generation.status === 'GENERATING_IMAGE') return 'Creating featured image...';
    if (hasContent && generation.status === 'PENDING') return 'Preparing image generation...';
    if (generation.status === 'GENERATING_CONTENT') return 'Writing blog content...';
    if (generation.status === 'AWAITING_SELECTION') return 'Ideas ready - please select one';
    
    // Skip "Generating ideas" if pre-selected
    if (generation.status === 'GENERATING_IDEAS' && !hasPreSelectedIdea) {
      return 'Generating blog ideas...';
    }
    if (generation.status === 'FAILED') return 'Generation failed';
    
    return 'Starting blog generation...';
  };

  const getProgress = () => {
    // Calculate based on what's been completed, not current status
    const hasContent = !!generation.blog_content;
    const hasImage = !!generation.blog_image_url;
    const isPublished = !!generation.draft_post_id;
    
    if (generation.status === 'DONE' || isPublished) return 100;
    if (generation.status === 'PUBLISHING') return 90;
    if (hasImage) return 75; // Image exists, waiting for publish
    if (generation.status === 'GENERATING_IMAGE') return 65;
    if (hasContent) return 50; // Content exists, waiting for image
    if (generation.status === 'GENERATING_CONTENT') return 40;
    
    // Pre-selected idea path
    const hasPreSelectedIdea = generation.blog_ideas && 
                               generation.blog_ideas.length > 0 && 
                               typeof generation.selected_idea_index === 'number';
    if (hasPreSelectedIdea) return 35;
    
    if (generation.status === 'AWAITING_SELECTION') return 30;
    if (generation.status === 'GENERATING_IDEAS') return 25;
    return 10;
  };

  if (generation.status === 'DONE') {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Blog post created!</h1>
          <p className="subtitle">Your blog post has been successfully generated</p>
        </div>

        <div className="completion-card">
          <div className="completion-icon">✓</div>
          <h2>{generation.blog_title}</h2>
          
          {generation.blog_image_url && (
            <img
              src={generation.blog_image_url}
              alt="Blog featured image"
              className="blog-featured-image-full"
            />
          )}

          <div className="blog-content-full">
            <div dangerouslySetInnerHTML={{ __html: generation.blog_content || '' }} />
          </div>

          <div className="action-buttons">
            <button
              className="primary-button"
              onClick={() => navigate('/blog-generations')}
            >
              Manage Blogs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (generation.status === 'FAILED') {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Generation failed</h1>
          <p className="subtitle">Something went wrong</p>
        </div>

        <div className="error-card">
          <p>{generation.error || 'An unknown error occurred'}</p>
          <button
            className="primary-button"
            onClick={() => navigate('/blog-generator')}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Generating your blog post</h1>
        <p className="subtitle">This may take a few minutes</p>
      </div>

      <div className="progress-card">
        <div className="progress-status">{getStatusMessage()}</div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${getProgress()}%` }} />
        </div>
        <div className="progress-percentage">{getProgress()}%</div>

        <div className="progress-steps">
          {/* Only show "Generate Ideas" step if NOT pre-selected */}
          {!(generation.blog_ideas && typeof generation.selected_idea_index === 'number') && (
            <div className={`step ${['GENERATING_IDEAS', 'GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING', 'DONE'].includes(generation.status) ? 'completed' : generation.status === 'PENDING' ? 'active' : ''}`}>
              <div className="step-icon">1</div>
              <div className="step-label">Generate Ideas</div>
            </div>
          )}
          <div className={`step ${['GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING', 'DONE'].includes(generation.status) || !!generation.blog_content ? 'completed' : generation.status === 'GENERATING_IDEAS' || generation.status === 'GENERATING_CONTENT' ? 'active' : ''}`}>
            <div className="step-icon">{generation.blog_ideas && typeof generation.selected_idea_index === 'number' ? '1' : '2'}</div>
            <div className="step-label">Write Content</div>
          </div>
          <div className={`step ${['GENERATING_IMAGE', 'PUBLISHING', 'DONE'].includes(generation.status) || !!generation.blog_image_url ? 'completed' : generation.status === 'GENERATING_CONTENT' || generation.status === 'GENERATING_IMAGE' ? 'active' : ''}`}>
            <div className="step-icon">{generation.blog_ideas && typeof generation.selected_idea_index === 'number' ? '2' : '3'}</div>
            <div className="step-label">Create Image</div>
          </div>
          <div className={`step ${['PUBLISHING', 'DONE'].includes(generation.status) || !!generation.draft_post_id ? 'completed' : generation.status === 'GENERATING_IMAGE' || generation.status === 'PUBLISHING' ? 'active' : ''}`}>
            <div className="step-icon">{generation.blog_ideas && typeof generation.selected_idea_index === 'number' ? '3' : '4'}</div>
            <div className="step-label">Publish</div>
          </div>
        </div>
      </div>
    </div>
  );
}
