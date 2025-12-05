import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - react-window types will be installed
import { FixedSizeList as List } from 'react-window';
import { ApiError, fetchWithAuth } from '../utils/api';
import './BlogGenerator.css';

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
  hook?: string;
  format?: string;
  keywords?: string[];
}

const BLOG_CREDIT_COST = 25;

export default function BlogGenerator() {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState<'product' | 'keyword'>('product');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [keywordPrompt, setKeywordPrompt] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache all products
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [creatingGeneration, setCreatingGeneration] = useState(false);
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [writerNameInput, setWriterNameInput] = useState('');
  const [writerMeta, setWriterMeta] = useState<{
    name: string | null;
    email: string | null;
    memberId: string | null;
  } | null>(null);
  const [writerLoading, setWriterLoading] = useState(true);
  const [writerSaving, setWriterSaving] = useState(false);
  const [writerAlert, setWriterAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [loadingRecentBlogs, setLoadingRecentBlogs] = useState(true);
  
  // Refs for optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const listRef = useRef<List>(null);
  
  const insufficientCredits = typeof credits === 'number' && credits < BLOG_CREDIT_COST;
  const writerConfigured = Boolean(writerMeta?.memberId);
  const writerRequired = !writerLoading && !writerConfigured;
  const canRequestIdeas =
    sourceType === 'product'
      ? !!selectedProductId
      : !!keywordPrompt.trim();

  // Progressive Loading - Fetch products in batches
  const fetchProducts = useCallback(async (cursor?: string, append = false) => {
    if (!append) {
      setFetchingProducts(true);
    }
    
    try {
      // Fetch products in batches of 100 (V1 API max limit)
      const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
      console.log('[BlogGenerator] Fetching products from: /api/products');
      const data = await fetchWithAuth(`/api/products?limit=100${cursorParam}`);
      console.log('[BlogGenerator] Products received:', data.products?.length || 0);
      
      // Append or replace products
      setAllProducts(prev => append ? [...prev, ...(data.products || [])] : (data.products || []));
      
      // Background fetch remaining products if there's more
      if (data.nextCursor && !append) {
        setTimeout(() => fetchProducts(data.nextCursor, true), 100);
      }
    } catch (err: any) {
      console.error('[BlogGenerator] Error fetching products:', err);
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
    setIdeas([]);
    setSelectedIdeaIndex(null);
    setIdeasError(null);
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

  // Fetch credits
  useEffect(() => {
    fetchCredits();
  }, []);

  useEffect(() => {
    loadWriterSettings();
    fetchRecentBlogs();
  }, []);

  const fetchRecentBlogs = async () => {
    setLoadingRecentBlogs(true);
    try {
      const response = await fetchWithAuth('/api/blog-generation?status=DONE');
      // Get the 5 most recent completed blogs
      const recentCompleted = (response.generations || [])
        .filter((gen: any) => gen.status === 'DONE')
        .slice(0, 5);
      setRecentBlogs(recentCompleted);
    } catch (err: any) {
      console.error('Error fetching recent blogs:', err);
      setRecentBlogs([]);
    } finally {
      setLoadingRecentBlogs(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

  const loadWriterSettings = async () => {
    setWriterLoading(true);
    try {
      const data = await fetchWithAuth('/api/blog-writer');
      setWriterMeta({
        name: data.writerName || null,
        email: data.writerEmail || null,
        memberId: data.writerMemberId || null,
      });
      setWriterNameInput(data.writerName || '');
      setWriterAlert(null);
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.data?.message || err.message
          : err?.message || 'Failed to load blog writer';
      setWriterAlert({ type: 'error', text: message });
      setWriterMeta(null);
    } finally {
      setWriterLoading(false);
    }
  };

  const handleSaveWriter = async () => {
    const trimmed = writerNameInput.trim();

    if (!trimmed) {
      setWriterAlert({ type: 'error', text: 'Please enter a writer name.' });
      return;
    }

    setWriterSaving(true);
    setWriterAlert(null);

    try {
      const data = await fetchWithAuth('/api/blog-writer', {
        method: 'PUT',
        body: JSON.stringify({ writerName: trimmed }),
      });

      setWriterMeta({
        name: data.writerName || trimmed,
        email: data.writerEmail || null,
        memberId: data.writerMemberId || null,
      });
      setWriterNameInput(data.writerName || trimmed);
      setWriterAlert({ type: 'success', text: 'Default writer saved.' });
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.data?.message || err.message
          : err?.message || 'Failed to save blog writer';
      setWriterAlert({ type: 'error', text: message });
    } finally {
      setWriterSaving(false);
    }
  };

  const handleGenerateIdeaSuggestions = async () => {
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
      setSelectedIdeaIndex(null);
    } catch (err: any) {
      console.error('Error generating idea suggestions:', err);
      setIdeasError(err.message || 'Failed to generate blog ideas.');
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleCreateGeneration = async () => {
    setError(null);

    if (sourceType === 'product' && !selectedProductId) {
      setError('Please select a product');
      return;
    }

    if (sourceType === 'keyword' && !keywordPrompt.trim()) {
      setError('Please enter a keyword or topic');
      return;
    }

    if (selectedIdeaIndex === null || !ideas[selectedIdeaIndex]) {
      setError('Select a blog idea to continue.');
      return;
    }

    if (insufficientCredits) {
      setError(`You need at least ${BLOG_CREDIT_COST} credits to generate a blog post.`);
      return;
    }

    setCreatingGeneration(true);

    try {
      const payload: Record<string, any> = {
        method: 'POST',
        body: JSON.stringify({
          sourceType,
          sourceId: sourceType === 'product' ? selectedProductId : keywordPrompt,
          sourceData: sourceType === 'keyword' ? keywordPrompt : undefined,
          selectedIdea: ideas[selectedIdeaIndex],
        }),
      };

      const response = await fetchWithAuth('/api/blog-generation', payload);

      // Redirect to progress page immediately
      navigate(`/blog-generation/${response.id}`);
    } catch (err: any) {
      console.error('Error creating blog generation:', err);
      
      if (err.message.includes('Insufficient credits') || err.message.includes('402')) {
        setError('Insufficient credits. Please upgrade your plan to continue.');
      } else {
        setError(err.message || 'Failed to start blog generation. Please try again.');
      }
      setCreatingGeneration(false);
    }
  };



  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Create a new blog post</h1>
          <p className="subtitle">
            Choose your source, review AI topic ideas, and generate a long-form blog with a featured image in one click.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/blog-generations')}>
            Manage blogs
          </button>
          <button className="btn-secondary" onClick={() => navigate('/blog-scheduler')}>
            Blog Scheduler
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="blog-generator-layout">
        {/* Left Column - Source Selection and Ideas */}
        <div className="left-column">
          <div className="section-card">
            <div className="tab-selector">
              <button
                className={sourceType === 'product' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => {
                  setSourceType('product');
                  setSelectedProductId('');
                }}
              >
                Store product
              </button>
              <button
                className={sourceType === 'keyword' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => {
                  setSourceType('keyword');
                  setKeywordPrompt('');
                }}
              >
                Keyword prompt
              </button>
            </div>

            {sourceType === 'product' ? (
              <>
                <h3 className="section-subtitle">Start from a store product</h3>
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
          </div>

          {/* Ideas Section - Moved under source selection */}
          <div className="section-card ideas-section">
          <div className="ideas-header">
            <div>
              <h3>Topic suggestions</h3>
              <p className="topic-subtitle">
                Preview five ideas based on your selection before starting a full generation.
              </p>
            </div>
            <button
              className="regenerate-button"
              onClick={handleGenerateIdeaSuggestions}
              disabled={ideasLoading || !canRequestIdeas}
            >
              {ideasLoading
                ? 'Generating...'
                : ideas.length > 0
                  ? 'Regenerate blog ideas'
                  : 'Generate blog ideas'}
            </button>
          </div>

          {!canRequestIdeas && (
            <p className="topic-hint">
              Select a product or enter a keyword to generate tailored suggestions.
            </p>
          )}

          {ideasError && <div className="error-banner">{ideasError}</div>}

          {ideasLoading && (
            <div className="loading-state">Collecting fresh ideas from our AI writer...</div>
          )}

          {!ideasLoading && ideas.length === 0 && canRequestIdeas && (
            <div className="empty-state muted">
              No ideas yet. Click “Generate blog ideas” to see tailored suggestions.
            </div>
          )}

          {ideas.length > 0 && (
            <div className="ideas-list">
              {ideas.map((idea, index) => {
                const tags =
                  Array.isArray(idea.keywords) && idea.keywords.length > 0
                    ? idea.keywords
                    : idea.targetAudience?.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 3) ||
                      [];

                const canGenerate = selectedIdeaIndex === index && 
                  !creatingGeneration && 
                  !insufficientCredits && 
                  !writerRequired;

                return (
                  <div
                    key={index}
                    className={`idea-card ${selectedIdeaIndex === index ? 'selected' : ''}`}
                    onClick={() => setSelectedIdeaIndex(index)}
                  >
                    <div className="idea-card-header">
                      <h4>{idea.title}</h4>
                      {selectedIdeaIndex === index && <span className="selected-badge">Selected</span>}
                    </div>
                    <p className="idea-description">{idea.description}</p>
                    {idea.hook && (
                      <p className="idea-hook">
                        <strong>Hook:</strong> {idea.hook}
                      </p>
                    )}
                    {idea.format && (
                      <p className="idea-format">
                        <strong>Format:</strong> {idea.format}
                      </p>
                    )}
                    <p className="idea-audience">
                      <strong>Audience:</strong> {idea.targetAudience}
                    </p>
                    {tags.length > 0 && (
                      <div className="idea-tags">
                        {tags.slice(0, 4).map(tag => (
                          <span key={tag} className="idea-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedIdeaIndex === index && (
                      <button
                        className="idea-generate-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateGeneration();
                        }}
                        disabled={!canGenerate}
                      >
                        {creatingGeneration ? 'Starting generation...' : 'Generate blog post'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>

        {/* Right Column - Credits, Writer, and Recent Blogs */}
        <div className="right-column">
          {/* Credit Balance Card */}
          <div className="section-card">
            <div className="credit-balance-card">
              <h3>Credit balance</h3>
              <div className="credit-amount">
                <span className="credit-number">
                  {loadingCredits ? '—' : credits ?? '—'}
                </span>
                <span className="credit-label">Credits available</span>
              </div>
              <button
                className="manage-credits-btn"
                type="button"
                onClick={() => navigate('/billing')}
              >
                Manage credits
              </button>
            </div>
          </div>

          {/* Blog Writer Card */}
          <div className="section-card writer-card">
            <div className="writer-status">
              <div>
                <h3>Blog writer</h3>
                <p className="writer-subtitle">
                  Drafts will be created in Wix under this member.
                </p>
              </div>
              <span
                className={`writer-pill ${
                  writerLoading
                    ? 'writer-pill--loading'
                    : writerConfigured
                      ? 'writer-pill--success'
                      : 'writer-pill--warning'
                }`}
              >
                {writerLoading ? 'Loading...' : writerConfigured ? 'Connected' : 'Required'}
              </span>
            </div>

            {/* Wix Blog Installation Notice */}
            <div className="blog-requirement-notice">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-content">
                <strong>Wix Blog Required</strong>
                <p>
                  Make sure Wix Blog is installed on your site before generating posts. 
                  Go to your Wix dashboard → Add Apps → Install "Wix Blog" and create at least one blog post manually to initialize it.
                </p>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Display name</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. My AI Writer"
                value={writerNameInput}
                onChange={(e) => setWriterNameInput(e.target.value)}
                disabled={writerLoading || writerSaving}
              />
            </div>

            {writerMeta?.memberId && (
              <p className="writer-meta muted">
                Member ID: <code>{writerMeta.memberId}</code>
              </p>
            )}

            {writerAlert && (
              <p className={`writer-message ${writerAlert.type}`}>
                {writerAlert.text}
              </p>
            )}

            <button
              className="writer-save-button"
              type="button"
              onClick={handleSaveWriter}
              disabled={writerSaving || writerLoading}
            >
              {writerSaving
                ? 'Saving writer...'
                : writerConfigured
                  ? 'Update writer'
                  : 'Save writer'}
            </button>

            <p className="writer-help muted">
              We create a hidden site member with this name so Wix Blog can attribute every draft. You can update it
              anytime.
            </p>
          </div>

          {/* Recent Blog Generations */}
          <div className="section-card">
            <div className="recent-blogs-header">
              <h3>Recent blog generations</h3>
              <button className="view-all-link" onClick={() => navigate('/blog-generations')}>
                View completed
              </button>
            </div>
            
            {loadingRecentBlogs ? (
              <div className="loading-state-small">Loading...</div>
            ) : recentBlogs.length === 0 ? (
              <div className="empty-state-small">No completed blogs yet</div>
            ) : (
              <div className="recent-blogs-list">
                {recentBlogs.map((blog: any) => (
                  <div 
                    key={blog.id} 
                    className="recent-blog-item"
                    onClick={() => navigate(`/blog-generation/${blog.id}`)}
                  >
                    <div className="recent-blog-info">
                      <h4>{blog.blog_title || 'Untitled Blog'}</h4>
                      <span className="recent-blog-meta">
                        {formatDate(blog.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generation Action Card */}
          <div className="section-card">
            {sourceType === 'keyword' && (
              <div className="form-field">
                <label className="field-label">Keyword or topic</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. sustainable fashion, home organization tips"
                  value={keywordPrompt}
                  onChange={(e) => setKeywordPrompt(e.target.value)}
                />
              </div>
            )}

            {insufficientCredits && !loadingCredits && (
              <div className="credit-warning">
                You need at least {BLOG_CREDIT_COST} credits to start a generation. Add
                credits in the Billing tab to continue.
              </div>
            )}

            <div className="generation-info">
              <p>
                Each generated blog post uses {BLOG_CREDIT_COST} credits and includes a featured
                image.
              </p>
            </div>

            <button
              className="generate-button"
              onClick={handleCreateGeneration}
              disabled={
                creatingGeneration ||
                (sourceType === 'product' && !selectedProductId) ||
                (sourceType === 'keyword' && !keywordPrompt.trim()) ||
                insufficientCredits ||
                writerRequired ||
                selectedIdeaIndex === null ||
                !ideas[selectedIdeaIndex]
              }
            >
              {creatingGeneration ? 'Starting generation...' : 'Generate blog post'}
            </button>
            {writerRequired && (
              <p className="topic-hint warning">
                Add a blog writer name above to enable generation.
              </p>
            )}
            {selectedIdeaIndex === null && ideas.length > 0 && (
              <p className="topic-hint warning">Select an idea above to enable generation.</p>
            )}
          </div>
        </div>
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
