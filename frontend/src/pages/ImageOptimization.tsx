import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - react-window types will be installed
import { FixedSizeList as List } from 'react-window';
import { fetchWithAuth } from '../utils/api';
import './ImageOptimization.css';

interface ProductImage {
  id: string;
  url: string;
  altText?: string;
}

interface MediaItem {
  id?: string;
  mediaType?: string;
  title?: string;
  image?: {
    url?: string;
    width?: number;
    height?: number;
  };
  video?: {
    files?: Array<{
      url?: string;
    }>;
  };
}

interface Product {
  id: string;
  name: string;
  media?: {
    mainMedia?: MediaItem;
    items?: MediaItem[];
  };
}

export default function ImageOptimization() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache all products
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [useGlobalPrompt, setUseGlobalPrompt] = useState(false);
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  // Refs for optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const listRef = useRef<List>(null);

  // Progressive Loading - Fetch products in batches
  const fetchProducts = useCallback(async (cursor?: string, append = false) => {
    if (!append) {
      setFetchingData(true);
    }
    setError(null);
    
    try {
      // Fetch products in batches of 100 (V1 API max limit)
      const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
      console.log('[ImageOptimization] Fetching products from: /api/products');
      const data = await fetchWithAuth(`/api/products?limit=100${cursorParam}`);
      console.log('[ImageOptimization] Products received:', data.products?.length || 0);
      
      // Append or replace products
      setAllProducts(prev => append ? [...prev, ...(data.products || [])] : (data.products || []));
      
      // Background fetch remaining products if there's more
      if (data.nextCursor && !append) {
        setTimeout(() => fetchProducts(data.nextCursor, true), 100);
      }
    } catch (err: any) {
      console.error('[ImageOptimization] Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      if (!append) {
        setAllProducts([]);
      }
    } finally {
      if (!append) {
        setFetchingData(false);
      }
    }
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    if (allProducts.length === 0) {
      fetchProducts();
    }
  }, [allProducts.length, fetchProducts]);

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
    if (!debouncedSearchQuery.trim()) {
      return allProducts;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, allProducts]);

  // Memoized handlers
  const handleProductSelect = useCallback((product: Product) => {
    console.log('[ImageOptimization] Selected product:', product.name);
    console.log('[ImageOptimization] Product media:', product.media);
    setSelectedProduct(product);
    setSelectedImages([]);
    setImagePrompts({});
  }, []);

  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  }, []);

  const handleImagePromptChange = useCallback((imageId: string, prompt: string) => {
    setImagePrompts(prev => ({ ...prev, [imageId]: prompt }));
  }, []);

  const getProductImages = (product: Product): ProductImage[] => {
    const images: ProductImage[] = [];
    
    // Add main image first
    if (product.media?.mainMedia?.image?.url) {
      images.push({
        id: product.media.mainMedia.id || 'main',
        url: product.media.mainMedia.image.url,
        altText: product.media.mainMedia.title || product.name
      });
    }
    
    // Add all additional images from media.items array
    if (product.media?.items && Array.isArray(product.media.items)) {
      console.log(`[ImageOptimization] Found ${product.media.items.length} media items for ${product.name}`);
      
      product.media.items.forEach((item, index) => {
        console.log(`[ImageOptimization] Media item ${index}:`, {
          id: item.id,
          mediaType: item.mediaType,
          hasImage: !!item.image?.url,
          hasVideo: !!item.video
        });
        
        // Only include items with mediaType 'image' and skip if it's the same as mainMedia
        if (item.mediaType === 'image' && item.image?.url) {
          // Skip if this is the same as the main image
          const isMainImage = product.media?.mainMedia?.id && item.id === product.media.mainMedia.id;
          if (!isMainImage) {
            images.push({
              id: item.id || `image-${index}`,
              url: item.image.url,
              altText: item.title || `${product.name} - Image ${index + 1}`
            });
          }
        }
      });
    }
    
    console.log(`[ImageOptimization] Total images extracted: ${images.length}`);
    return images;
  };

  const handleOptimize = async () => {
    if (!selectedProduct || selectedImages.length === 0) {
      setError('Please select a product and at least one image');
      return;
    }

    if (selectedImages.length > 10) {
      setError('Maximum 10 images can be optimized at once');
      return;
    }

    // Validate prompts
    if (!useGlobalPrompt) {
      const missingPrompts = selectedImages.filter(id => !imagePrompts[id]?.trim());
      if (missingPrompts.length > 0) {
        setError('Please provide prompts for all selected images or use a global prompt');
        return;
      }
    } else if (!globalPrompt.trim()) {
      setError('Please provide a global prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productImages = getProductImages(selectedProduct);
      const optimizationData = selectedImages.map(imageId => {
        const image = productImages.find(img => img.id === imageId);
        return {
          imageId,
          imageUrl: image?.url || '',
          prompt: useGlobalPrompt ? globalPrompt : (imagePrompts[imageId] || globalPrompt)
        };
      });

      await fetchWithAuth('/api/image-optimization', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          images: optimizationData
        })
      });
      
      // Navigate to ongoing page
      navigate('/ongoing-image-optimization');
    } catch (err: any) {
      console.error('Error creating optimization job:', err);
      setError(err.message || 'Failed to create optimization job');
    } finally {
      setLoading(false);
    }
  };

  const productImages = selectedProduct ? getProductImages(selectedProduct) : [];
  const creditsRequired = selectedImages.length * 15;

  return (
    <div className="image-optimization-page">
      <div className="page-header">
        <div>
          <h1>Image Optimization</h1>
          <p className="subtitle">Pick a product and craft prompts to bulk optimize up to 10 images at a time.</p>
        </div>
        <div className="header-tabs">
          <button
            className="tab-button"
            onClick={() => navigate('/ongoing-image-optimization')}
          >
            Ongoing Image Optimizations
          </button>
          <button
            className="tab-button"
            onClick={() => navigate('/completed-image-optimization')}
          >
            Completed Image Optimizations
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="optimization-layout">
        {/* Left Column - Product Selection */}
        <div className="left-panel">
          <div className="panel-card">
            <h2 className="panel-title">Bulk Image Optimization</h2>
            <p className="panel-description">
              Pick a product to preview its images and choose up to ten for optimization.
            </p>

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

            {fetchingData ? (
              <div className="loading-state">Loading products...</div>
            ) : (
              <div className="product-list-container">
                {filteredProducts.length > 0 ? (
                  <List
                    ref={listRef}
                    height={600}
                    itemCount={filteredProducts.length}
                    itemSize={84}
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
                          isSelected={selectedProduct?.id === product.id}
                          onSelect={handleProductSelect}
                        />
                      );
                    }}
                  </List>
                ) : (
                  <div className="empty-state">No products found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Image Selection and Prompts */}
        <div className="right-panel">
          <div className="panel-card">
            {selectedProduct ? (
              <>
                <div className="selected-product-header">
                  <h2 className="panel-title">{selectedProduct.name}</h2>
                  <p className="image-count">
                    Selected {selectedImages.length} / {productImages.length} • {creditsRequired} credits (15 credits per image)
                  </p>
                  <p className="credits-available">
                    Available credits: {loadingCredits ? 'Loading...' : credits !== null ? credits.toLocaleString() : '—'}
                  </p>
                </div>

                <div className="global-prompt-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useGlobalPrompt}
                      onChange={(e) => setUseGlobalPrompt(e.target.checked)}
                    />
                    <span>Use a global prompt for all selected images</span>
                  </label>
                  {useGlobalPrompt && (
                    <textarea
                      className="global-prompt-input"
                      placeholder="Enter optimization instructions for all selected images..."
                      value={globalPrompt}
                      onChange={(e) => setGlobalPrompt(e.target.value)}
                      rows={3}
                    />
                  )}
                </div>

                <p className="instruction-text">
                  Select images above to unlock individual prompt fields.
                </p>

                {productImages.length === 0 ? (
                  <div className="empty-state">
                    <p>This product has no images available.</p>
                  </div>
                ) : (
                  <div className="images-grid">
                    {productImages.map(image => (
                      <div key={image.id} className="image-item">
                        <div
                          className={`image-wrapper ${selectedImages.includes(image.id) ? 'selected' : ''}`}
                          onClick={() => toggleImageSelection(image.id)}
                        >
                          <img src={image.url} alt={image.altText} className="product-img" />
                          {selectedImages.includes(image.id) && (
                            <div className="selection-overlay">
                              <div className="checkmark">✓</div>
                            </div>
                          )}
                        </div>
                        {selectedImages.includes(image.id) && !useGlobalPrompt && (
                          <textarea
                            className="image-prompt-input"
                            placeholder="Enter optimization instructions for this image..."
                            value={imagePrompts[image.id] || ''}
                            onChange={(e) => handleImagePromptChange(image.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            rows={2}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="action-section">
                  <button
                    className="optimize-button"
                    onClick={handleOptimize}
                    disabled={loading || selectedImages.length === 0}
                  >
                    {loading ? 'Processing...' : `Optimize ${selectedImages.length} images · ${creditsRequired} credits`}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-selection">
                <p>Select a product from the left to view and optimize its images</p>
              </div>
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
  onSelect: (product: Product) => void;
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
  
  const imageUrl = product.media?.mainMedia?.image?.url || 'https://via.placeholder.com/60';
  
  return (
    <div
      style={style}
      className={`product-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(product)}
    >
      <img 
        ref={imgRef}
        src={imageLoaded ? imageUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%23f0f0f0" width="60" height="60"/%3E%3C/svg%3E'}
        alt={product.name}
        className="product-image"
        loading="lazy"
      />
      <div className="product-details">
        <span className="product-name">{product.name}</span>
        <span className="product-status">ACTIVE</span>
      </div>
    </div>
  );
};
