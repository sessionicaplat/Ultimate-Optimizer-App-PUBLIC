import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - react-window types will be installed
import { FixedSizeList as List } from 'react-window';
import { fetchWithAuth } from '../utils/api';
import './ProductOptimizer.css';

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

interface Collection {
  id: string;
  name: string;
  numberOfProducts?: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'cs', name: 'Czech' },
  { code: 'sk', name: 'Slovak' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'el', name: 'Greek' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'he', name: 'Hebrew' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'is', name: 'Icelandic' },
];

interface Attributes {
  name: boolean;
  description: boolean;
  seoTitle: boolean;
  seoDescription: boolean;
}

export default function ProductOptimizer() {
  const navigate = useNavigate();
  const [sourceScope, setSourceScope] = useState<'products' | 'collections'>('products');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [attributes, setAttributes] = useState<Attributes>({
    name: false,
    description: false,
    seoTitle: false,
    seoDescription: false,
  });
  const [targetLang, setTargetLang] = useState('en');
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  // State for fetched data
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache all products
  const [collections, setCollections] = useState<Collection[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Refs for optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const listRef = useRef<List>(null);

  // Solution 2: Progressive Loading - Fetch products in batches
  const fetchProducts = useCallback(async (cursor?: string, append = false) => {
    if (!append) {
      setFetchingData(true);
    }
    setDataError(null);
    
    try {
      // Fetch products in batches of 100 (V1 API max limit)
      const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
      console.log('[ProductOptimizer] Fetching products from: /api/products');
      const data = await fetchWithAuth(`/api/products?limit=100${cursorParam}`);
      console.log('[ProductOptimizer] Products received:', data.products?.length || 0);
      
      // Append or replace products
      setAllProducts(prev => append ? [...prev, ...(data.products || [])] : (data.products || []));
      
      // Background fetch remaining products if there's more
      if (data.nextCursor && !append) {
        setTimeout(() => fetchProducts(data.nextCursor, true), 100);
      }
    } catch (err: any) {
      console.error('[ProductOptimizer] Error fetching products:', err);
      setDataError(err.message || 'Failed to load products');
      if (!append) {
        setAllProducts([]);
      }
    } finally {
      if (!append) {
        setFetchingData(false);
      }
    }
  }, []);

  const fetchCollections = async () => {
    setFetchingData(true);
    setDataError(null);
    try {
      console.log('[ProductOptimizer] Fetching collections from: /api/collections');
      const data = await fetchWithAuth('/api/collections');
      console.log('[ProductOptimizer] Collections received:', data.collections?.length || 0);
      setCollections(data.collections || []);
    } catch (err: any) {
      console.error('[ProductOptimizer] Error fetching collections:', err);
      console.error('[ProductOptimizer] Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      setDataError(err.message || 'Failed to load collections');
      setCollections([]);
    } finally {
      setFetchingData(false);
    }
  };

  // Fetch credits
  useEffect(() => {
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

    fetchCredits();
  }, []);

  // Fetch products when component mounts or when switching to products scope
  useEffect(() => {
    if (sourceScope === 'products' && allProducts.length === 0) {
      fetchProducts();
    }
  }, [sourceScope, allProducts.length, fetchProducts]);

  // Fetch collections when switching to collections scope
  useEffect(() => {
    if (sourceScope === 'collections' && collections.length === 0) {
      fetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceScope]);

  // Solution 3: Debounced search (300ms delay)
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

  // Solution 3: Memoized filtering for products (optimized with useMemo)
  const filteredProducts = useMemo(() => {
    if (sourceScope !== 'products') return [];
    
    if (!debouncedSearchQuery.trim()) {
      return allProducts;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, allProducts, sourceScope]);

  // Solution 3: Memoized filtering for collections
  const filteredCollections = useMemo(() => {
    if (sourceScope !== 'collections') return [];
    
    if (!debouncedSearchQuery.trim()) {
      return collections;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return collections.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, collections, sourceScope]);

  // Solution 5: Set-based selection for O(1) lookups
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  
  // Solution 3: Memoized toggle handler
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // Solution 3: Memoized attribute toggle
  const toggleAttribute = useCallback((attr: keyof Attributes) => {
    setAttributes(prev => ({ ...prev, [attr]: !prev[attr] }));
  }, []);

  const calculateCredits = () => {
    const productCount = sourceScope === 'products' 
      ? selectedIds.length 
      : selectedIds.reduce((sum, id) => {
          const collection = collections.find(c => c.id === id);
          return sum + (collection?.numberOfProducts || 0);
        }, 0);
    
    const attributeCount = Object.values(attributes).filter(Boolean).length;
    return productCount * attributeCount;
  };

  const handleGenerate = async () => {
    setError(null);
    
    if (selectedIds.length === 0) {
      setError('Please select at least one product or collection');
      return;
    }

    const attributeCount = Object.values(attributes).filter(Boolean).length;
    if (attributeCount === 0) {
      setError('Please select at least one attribute to optimize');
      return;
    }

    // Check if user has enough credits
    const requiredCredits = calculateCredits();
    if (credits !== null && credits < requiredCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} credits but only have ${credits} available.`);
      return;
    }

    setLoading(true);
    
    try {
      // Prepare the request payload
      let sourceIds: any = selectedIds;
      
      // If collections are selected, we need to include product IDs
      if (sourceScope === 'collections') {
        sourceIds = selectedIds.map(collectionId => {
          // For now, we'll send the collection ID and let the backend handle fetching products
          // In a real implementation, we might need to fetch products for each collection first
          return {
            collectionId,
            productIds: [], // Backend will need to fetch these
          };
        });
      }

      await fetchWithAuth('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          sourceScope,
          sourceIds,
          attributes,
          targetLang,
          userPrompt: userPrompt || 'Optimize this content to be more engaging and professional.',
        }),
      });

      // Update credits after successful job creation
      if (credits !== null) {
        setCredits(Math.max(0, credits - requiredCredits));
      }

      // Success - redirect to ongoing optimizations page
      navigate('/queue');
      
    } catch (err: any) {
      console.error('Error creating job:', err);
      
      // Check for insufficient credits error
      if (err.message.includes('Insufficient credits') || err.message.includes('402')) {
        setError('Insufficient credits. Please upgrade your plan to continue.');
      } else {
        setError(err.message || 'Failed to create optimization job. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const requiredCredits = calculateCredits();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Product Optimization</h1>
          <p className="subtitle">Bulk-generate and optimize product content with AI</p>
        </div>
        <div className="header-actions">
          <button 
            className="header-nav-btn"
            onClick={() => navigate('/queue')}
          >
            Ongoing Optimizations
          </button>
          <button 
            className="header-nav-btn"
            onClick={() => navigate('/completed')}
          >
            Completed Optimizations
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {dataError && (
        <div className="error-banner">
          {dataError}
        </div>
      )}

      <div className="optimizer-layout">
        {/* Left Column - Product Selection */}
        <div className="left-column">
          <div className="section-card">
            <h2 className="section-title">Bulk Content Generation</h2>
            <ul className="info-list">
              <li>Select multiple products (up to 250 ) for bulk generation</li>
              <li>Choose a single collection to generate content for 90% of its products</li>
            </ul>

            <div className="tab-selector">
              <button
                className={sourceScope === 'products' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => {
                  setSourceScope('products');
                  setSelectedIds([]);
                }}
              >
                Products
              </button>
              <button
                className={sourceScope === 'collections' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => {
                  setSourceScope('collections');
                  setSelectedIds([]);
                }}
              >
                Collections
              </button>
            </div>

            <div className="search-container">
              <div className="search-box">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder={`Search ${sourceScope}...`}
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

            {fetchingData ? (
              <div className="loading-state">Loading {sourceScope}...</div>
            ) : (
              <div className="product-list-container">
                {sourceScope === 'products' ? (
                  filteredProducts.length > 0 ? (
                    // Solution 1: Virtual Scrolling with react-window
                    <List
                      ref={listRef}
                      height={500}
                      itemCount={filteredProducts.length}
                      itemSize={72}
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
                            isSelected={selectedSet.has(product.id)}
                            onToggle={toggleSelection}
                          />
                        );
                      }}
                    </List>
                  ) : (
                    <div className="empty-state">No products found</div>
                  )
                ) : (
                  filteredCollections.length > 0 ? (
                    // Virtual scrolling for collections too
                    <List
                      ref={listRef}
                      height={500}
                      itemCount={filteredCollections.length}
                      itemSize={72}
                      width="100%"
                      className="product-list-virtual"
                    >
                      {({ index, style }: { index: number; style: React.CSSProperties }) => {
                        const collection = filteredCollections[index];
                        return (
                          <CollectionRow
                            key={collection.id}
                            collection={collection}
                            style={style}
                            isSelected={selectedSet.has(collection.id)}
                            onToggle={toggleSelection}
                          />
                        );
                      }}
                    </List>
                  ) : (
                    <div className="empty-state">No collections found</div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Generation Settings */}
        <div className="right-column">
          <div className="section-card">
            <h2 className="section-title">Generation Settings</h2>
            <p className="settings-subtitle">Descriptions will be generated for {selectedIds.length} products</p>

            <div className="checkbox-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={attributes.description}
                  onChange={() => toggleAttribute('description')}
                />
                <span>Description</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={attributes.name}
                  onChange={() => toggleAttribute('name')}
                />
                <span>Product Title</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={attributes.seoTitle}
                  onChange={() => toggleAttribute('seoTitle')}
                />
                <span>Meta Title</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={attributes.seoDescription}
                  onChange={() => toggleAttribute('seoDescription')}
                />
                <span>Meta Description</span>
              </label>
            </div>

            <div className="form-field">
              <label className="field-label">Output Language</label>
              <select
                className="select-field"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="field-label">Custom Prompt</label>
              <textarea
                className="textarea-field"
                placeholder="Craft a concise product description."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={3}
              />
              <div className="prompt-hints">
                <p>Open with a compelling line that names the product and emphasizes its top advantage for the intended customer.</p>
                <p>Present the standout features as 3-5 easy-to-read bullet points.</p>
                <p>Conclude by stating who it's ideal for, when or where it's best used, and reinforce with a unique promise or key differentiator.</p>
                <p>Ensure the copy remains brief, clear, and easy to skim.</p>
              </div>
              <p className="prompt-note">Customize how AI generates your content.</p>
            </div>

            <div className="credits-section">
              <p className="credits-info">
                <span className="credits-label">
                  Available credits: {loadingCredits ? 'Loading...' : credits !== null ? credits.toLocaleString() : '—'}
                </span>
              </p>
              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={loading || requiredCredits === 0 || (credits !== null && credits < requiredCredits)}
              >
                {loading ? 'Creating...' : `Generate ${selectedIds.length} products · ${requiredCredits} credits`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Solution 1 & 4: Optimized Product Row Component with lazy loading
interface ProductRowProps {
  product: Product;
  style: React.CSSProperties;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ProductRow = ({ product, style, isSelected, onToggle }: ProductRowProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Solution 4: Lazy load images using Intersection Observer
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
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(product.id)}
      />
      <img 
        ref={imgRef}
        src={imageLoaded ? imageUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23f0f0f0" width="50" height="50"/%3E%3C/svg%3E'}
        alt={product.name}
        className="product-thumb"
        loading="lazy"
      />
      <div className="product-info">
        <span className="product-name">{product.name}</span>
        <span className="product-status">ACTIVE</span>
      </div>
    </label>
  );
};

// Solution 1: Optimized Collection Row Component
interface CollectionRowProps {
  collection: Collection;
  style: React.CSSProperties;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const CollectionRow = ({ collection, style, isSelected, onToggle }: CollectionRowProps) => {
  return (
    <label style={style} className="product-item">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(collection.id)}
      />
      <span className="product-name">{collection.name}</span>
      <span className="product-count">({collection.numberOfProducts || 0} products)</span>
    </label>
  );
};
