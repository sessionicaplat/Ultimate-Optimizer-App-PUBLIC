import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - react-window types will be installed
import { FixedSizeList as List } from 'react-window';
import { fetchWithAuth } from '../utils/api';
import './BlogScheduler.css';

interface Product {
  id: string;
  name: string;
  media?: {
    mainMedia?: {
      image?: {
        url?: string;
      };
    };
  };
}

interface BlogIdea {
  title: string;
  description: string;
  targetAudience: string;
}

interface ScheduledBlogItem {
  sourceType: 'product' | 'keyword';
  sourceId?: string;
  blogIdea?: BlogIdea;
  scheduledDate: string;
}

export default function BlogScheduler() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState('');
  const [sourceType, setSourceType] = useState<'product' | 'keyword'>('product');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [keywordPrompt, setKeywordPrompt] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache all products
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [scheduledBlogs, setScheduledBlogs] = useState<ScheduledBlogItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const listRef = useRef<List>(null);

  const BLOG_CREDIT_COST = 25;
  const creditsNeeded = scheduledBlogs.length * BLOG_CREDIT_COST;
  const insufficientCredits = typeof credits === 'number' && credits < creditsNeeded;

  // Progressive Loading - Fetch products in batches
  const fetchProducts = useCallback(async (cursor?: string, append = false) => {
    if (!append) {
      setFetchingProducts(true);
    }
    
    try {
      // Fetch products in batches of 100 (V1 API max limit)
      const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
      console.log('[BlogScheduler] Fetching products from: /api/products');
      const data = await fetchWithAuth(`/api/products?limit=100${cursorParam}`);
      console.log('[BlogScheduler] Products received:', data.products?.length || 0);
      
      // Append or replace products
      setAllProducts(prev => append ? [...prev, ...(data.products || [])] : (data.products || []));
      
      // Background fetch remaining products if there's more
      if (data.nextCursor && !append) {
        setTimeout(() => fetchProducts(data.nextCursor, true), 100);
      }
    } catch (err: any) {
      console.error('[BlogScheduler] Error fetching products:', err);
      if (!append) {
        setAllProducts([]);
      }
    } finally {
      if (!append) {
        setFetchingProducts(false);
      }
    }
  }, []);

  // Fetch products when switching to product mode
  useEffect(() => {
    if (sourceType === 'product' && allProducts.length === 0) {
      fetchProducts();
    }
  }, [sourceType, allProducts.length, fetchProducts]);

  // Debounced search (300ms delay)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Memoized filtering for products
  const filteredProducts = useMemo(() => {
    if (sourceType !== 'product') return [];
    
    if (!debouncedSearchQuery.trim()) {
      return allProducts;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, allProducts, sourceType]);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoadingCredits(true);
    try {
      const data = await fetchWithAuth('/api/me');
      const remaining =
        typeof data.creditsRemaining === 'number'
          ? data.creditsRemaining
          : typeof data.creditsTotal === 'number' && typeof data.creditsUsedMonth === 'number'
            ? data.creditsTotal - data.creditsUsedMonth
            : null;

      if (typeof remaining === 'number' && Number.isFinite(remaining)) {
        setCredits(Math.max(0, Math.floor(remaining)));
      } else {
        setCredits(null);
      }
    } catch (err: any) {
      console.error('Error fetching credits:', err);
      setCredits(null);
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleGenerateIdeas = async () => {
    setIdeasError(null);

    if (sourceType === 'product' && !selectedProductId) {
      setIdeasError('Please select a product before generating ideas.');
      return;
    }

    if (sourceType === 'keyword' && !keywordPrompt.trim()) {
      setIdeasError('Please enter a keyword or topic.');
      return;
    }

    setIdeasLoading(true);

    try {
      const payload =
        sourceType === 'product'
          ? { sourceType, sourceId: selectedProductId }
          : { sourceType, keyword: keywordPrompt.trim() };

      const response = await fetchWithAuth('/api/blog-generation/ideas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIdeas(response.ideas || []);
    } catch (err: any) {
      console.error('Error generating ideas:', err);
      setIdeasError(err.message || 'Failed to generate blog ideas.');
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleAddToSchedule = (idea: BlogIdea, scheduledDate: string) => {
    if (scheduledBlogs.length >= 30) {
      setError('Maximum 30 blogs per campaign');
      return;
    }

    const newBlog: ScheduledBlogItem = {
      sourceType,
      sourceId: sourceType === 'product' ? selectedProductId : keywordPrompt,
      blogIdea: idea,
      scheduledDate,
    };

    setScheduledBlogs([...scheduledBlogs, newBlog]);
  };

  const handleRemoveFromSchedule = (index: number) => {
    setScheduledBlogs(scheduledBlogs.filter((_, i) => i !== index));
  };

  const handleSaveCampaign = async () => {
    setError(null);

    if (!campaignName.trim()) {
      setError('Please enter a campaign name');
      return;
    }

    if (scheduledBlogs.length === 0) {
      setError('Please add at least one blog to the schedule');
      return;
    }

    if (insufficientCredits) {
      setError(`You need ${creditsNeeded} credits but only have ${credits} available.`);
      return;
    }

    setCreating(true);

    try {
      // Create campaign
      const campaignResponse = await fetchWithAuth('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name: campaignName.trim() }),
      });

      // Add scheduled blogs to campaign
      await fetchWithAuth(`/api/campaigns/${campaignResponse.id}/scheduled-blogs`, {
        method: 'POST',
        body: JSON.stringify({ scheduledBlogs }),
      });

      navigate('/campaigns');
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Blog Scheduler</h1>
          <p className="subtitle">
            Generate blog ideas and schedule up to 30 posts to publish automatically at different dates and times.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/campaigns')}>
            View Campaigns
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="scheduler-layout">
        {/* Left Column */}
        <div className="left-column">
          {/* Campaign Name */}
          <div className="section-card">
            <h3>Campaign name</h3>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Holiday launch sequence"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Source Selection */}
          <div className="section-card">
            <div className="tab-selector">
              <button
                className={sourceType === 'product' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setSourceType('product')}
              >
                Store product
              </button>
              <button
                className={sourceType === 'keyword' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setSourceType('keyword')}
              >
                Keyword prompt
              </button>
            </div>

            {sourceType === 'product' ? (
              <>
                <h3 className="section-subtitle">Select a product</h3>
                <div className="search-container">
                  <div className="search-box">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      className="search-input-field"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {fetchingProducts ? (
                  <div className="loading-state">Loading products...</div>
                ) : (
                  <div className="product-list-container">
                    {filteredProducts.length > 0 ? (
                      <List
                        ref={listRef}
                        height={400}
                        itemCount={filteredProducts.length}
                        itemSize={74}
                        width="100%"
                        className="product-list-virtual"
                      >
                        {({ index, style }: { index: number; style: React.CSSProperties }) => {
                          const product = filteredProducts[index];
                          return (
                            <ProductRow
                              key={product.id}
                              product={product}
                              style={style}
                              isSelected={selectedProductId === product.id}
                              onSelect={setSelectedProductId}
                            />
                          );
                        }}
                      </List>
                    ) : (
                      <div className="empty-state">No products found</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="section-subtitle">Enter keyword or topic</h3>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. sustainable fashion, home organization tips"
                  value={keywordPrompt}
                  onChange={(e) => setKeywordPrompt(e.target.value)}
                />
              </>
            )}

            <button
              className="generate-ideas-btn"
              onClick={handleGenerateIdeas}
              disabled={
                ideasLoading ||
                (sourceType === 'product' && !selectedProductId) ||
                (sourceType === 'keyword' && !keywordPrompt.trim())
              }
            >
              {ideasLoading ? 'Generating ideas...' : 'Get blog topic ideas'}
            </button>
          </div>

          {/* Ideas List */}
          {ideasError && <div className="error-banner">{ideasError}</div>}

          {ideas.length > 0 && (
            <div className="section-card">
              <h3>Topic suggestions</h3>
              <div className="ideas-list">
                {ideas.map((idea, index) => (
                  <IdeaCard
                    key={index}
                    idea={idea}
                    onAddToSchedule={handleAddToSchedule}
                    disabled={scheduledBlogs.length >= 30}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Campaign Summary */}
          <div className="section-card">
            <h3>Campaign summary</h3>
            <p className="timezone-info">
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </p>
            <div className="summary-row">
              <span>Scheduled blogs</span>
              <span className="summary-value">{scheduledBlogs.length}</span>
            </div>
            <div className="summary-row">
              <span>Credits needed</span>
              <span className="summary-value">{creditsNeeded}</span>
            </div>
            <div className="summary-row">
              <span>Credits available</span>
              <span className="summary-value">{loadingCredits ? '—' : credits ?? '—'}</span>
            </div>
            <button
              className="save-campaign-btn"
              onClick={handleSaveCampaign}
              disabled={creating || scheduledBlogs.length === 0 || !campaignName.trim() || insufficientCredits}
            >
              {creating ? 'Saving campaign...' : 'Save campaign'}
            </button>
          </div>

          {/* Scheduled Blogs */}
          <div className="section-card">
            <h3>Scheduled blogs</h3>
            <p className="helper-text">
              Blog titles may be refined by AI during generation for better SEO and engagement.
            </p>
            {scheduledBlogs.length === 0 ? (
              <div className="empty-state-small">
                No blogs scheduled yet. Generate a topic and add it to the schedule.
              </div>
            ) : (
              <div className="scheduled-list">
                {scheduledBlogs.map((blog, index) => (
                  <div key={index} className="scheduled-item">
                    <div className="scheduled-info">
                      <h4>{blog.blogIdea?.title || 'Untitled'}</h4>
                      <span className="scheduled-date">
                        {new Date(blog.scheduledDate).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromSchedule(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface IdeaCardProps {
  idea: BlogIdea;
  onAddToSchedule: (idea: BlogIdea, scheduledDate: string) => void;
  disabled: boolean;
}

function IdeaCard({ idea, onAddToSchedule, disabled }: IdeaCardProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleAdd = () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }

    // Create date in local timezone and convert to ISO string (UTC)
    const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const utcDateTime = localDateTime.toISOString();
    
    onAddToSchedule(idea, utcDateTime);
    setScheduledDate('');
    setScheduledTime('');
  };

  return (
    <div className="idea-card">
      <h4>{idea.title}</h4>
      <p className="idea-description">{idea.description}</p>
      <p className="idea-audience">
        <strong>Audience:</strong> {idea.targetAudience}
      </p>

      <div className="schedule-controls">
        <div className="datetime-inputs">
          <input
            type="date"
            className="date-input"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <input
            type="time"
            className="time-input"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>
        <button
          className="add-to-schedule-btn"
          onClick={handleAdd}
          disabled={disabled || !scheduledDate || !scheduledTime}
        >
          Add to schedule
        </button>
      </div>
    </div>
  );
}


// Optimized Product Row Component with lazy loading
interface ProductRowProps {
  product: Product;
  style: React.CSSProperties;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ProductRow = ({ product, style, isSelected, onSelect }: ProductRowProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Lazy load images using Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !imageLoaded) {
            setImageLoaded(true);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [imageLoaded]);
  
  const imageUrl = product.media?.mainMedia?.image?.url || 'https://via.placeholder.com/50';
  
  return (
    <label style={style} className="product-item">
      <input
        type="radio"
        name="product"
        checked={isSelected}
        onChange={() => onSelect(product.id)}
      />
      <img 
        ref={imgRef}
        src={imageLoaded ? imageUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23f0f0f0" width="50" height="50"/%3E%3C/svg%3E'}
        alt={product.name}
        className="product-thumb"
        loading="lazy"
      />
      <span className="product-name">{product.name}</span>
    </label>
  );
};
