import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth, ApiError } from '../utils/api';
import './JobDetails.css';

// Wix SDK import for navigation
declare const window: Window & {
  Wix?: {
    navigateToSection?: (section: { sectionId: string; appDefinitionId?: string; memberId?: string }) => void;
  };
};

interface JobItem {
  id: number;
  jobId: number;
  productId: string;
  attribute: string;
  beforeValue: string | null;
  afterValue: string | null;
  status: 'DONE' | 'FAILED';
  error?: string | null;
  published?: boolean;
}

interface Job {
  id: number;
  status: string;
  sourceScope: string;
  targetLang: string;
  userPrompt: string;
  totalItems: number;
  completedItems: number;
  createdAt: string;
  finishedAt?: string;
}

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  media?: {
    mainMedia?: {
      image?: {
        url?: string;
      };
    };
  };
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [publishingAll, setPublishingAll] = useState(false);
  const [publishingProducts, setPublishingProducts] = useState<Set<string>>(new Set());
  const [configExpanded, setConfigExpanded] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, ProductDetails>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [publishingSelected, setPublishingSelected] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setError(null);
      const [jobResponse, itemsResponse] = await Promise.all([
        fetchWithAuth(`/api/jobs/${jobId}`),
        fetchWithAuth(`/api/jobs/${jobId}/items`),
      ]);
      setJob(jobResponse);
      setItems(itemsResponse.items || []);
      
      // Fetch product details for all unique product IDs
      const uniqueProductIds = [...new Set((itemsResponse.items as JobItem[]).map((item) => item.productId))];
      const productDetailsMap: Record<string, ProductDetails> = {};
      
      await Promise.all(
        uniqueProductIds.map(async (productId: string) => {
          try {
            const response = await fetchWithAuth(`/api/products/${productId}`);
            if (response.product) {
              productDetailsMap[productId] = response.product;
            }
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            // Set fallback data if fetch fails
            productDetailsMap[productId] = {
              id: productId,
              name: productId,
              slug: productId,
            };
          }
        })
      );
      
      setProductDetails(productDetailsMap);
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

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Group items by productId
  const groupedProducts = items.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push(item);
    return acc;
  }, {} as Record<string, JobItem[]>);

  const handlePublishProduct = async (productId: string) => {
    const productItems = groupedProducts[productId];
    const unpublishedItems = productItems.filter(item => item.status === 'DONE' && !item.published);
    
    if (unpublishedItems.length === 0) return;

    setPublishingProducts(prev => new Set(prev).add(productId));
    const itemIds = unpublishedItems.map(item => item.id);

    try {
      const response = await fetchWithAuth('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ itemIds }),
      });

      const successfulIds = response.results
        .filter((r: any) => r.success)
        .map((r: any) => r.itemId);

      setItems(prevItems =>
        prevItems.map(item =>
          successfulIds.includes(item.id) ? { ...item, published: true } : item
        )
      );
    } catch (err) {
      console.error('Failed to publish product:', err);
    } finally {
      setPublishingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const isProductPublished = (productId: string) => {
    const productItems = groupedProducts[productId];
    return productItems.every(item => item.published || item.status === 'FAILED');
  };

  const isProductPublishing = (productId: string) => {
    return publishingProducts.has(productId);
  };

  const handleViewInStore = async (productId: string) => {
    try {
      // Fetch product details including slug from backend
      const response = await fetchWithAuth(`/api/products/${productId}`);
      const product = response.product;
      
      if (product && product.slug) {
        // Navigate to product page using the slug
        const productPageUrl = `/product-page/${product.slug}`;
        
        // Use Wix SDK if available, otherwise open in new tab
        if (window.Wix && window.Wix.navigateToSection) {
          window.Wix.navigateToSection({
            sectionId: productPageUrl,
          });
        } else {
          // Fallback: construct full URL and open in new tab
          window.open(productPageUrl, '_blank');
        }
      } else {
        console.error('Product slug not found');
        alert('Unable to navigate to product page. Product slug not found.');
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      alert('Unable to navigate to product page. Please try again.');
    }
  };

  const handlePublishAll = async () => {
    const unpublishedItems = items.filter(item => item.status === 'DONE' && !item.published);
    if (unpublishedItems.length === 0) return;

    setPublishingAll(true);
    const itemIds = unpublishedItems.map(item => item.id);

    try {
      const response = await fetchWithAuth('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ itemIds }),
      });

      // Update published status for successful items
      const successfulIds = response.results
        .filter((r: any) => r.success)
        .map((r: any) => r.itemId);

      setItems(prevItems =>
        prevItems.map(item =>
          successfulIds.includes(item.id) ? { ...item, published: true } : item
        )
      );
    } catch (err) {
      console.error('Failed to publish items:', err);
    } finally {
      setPublishingAll(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allProductIds = Object.keys(groupedProducts);
    setSelectedProducts(new Set(allProductIds));
  };

  const handlePublishSelected = async () => {
    if (selectedProducts.size === 0) return;

    setPublishingSelected(true);

    // Get all unpublished items for selected products
    const selectedProductIds = Array.from(selectedProducts);
    const unpublishedItems = items.filter(
      item => selectedProductIds.includes(item.productId) && 
              item.status === 'DONE' && 
              !item.published
    );

    if (unpublishedItems.length === 0) {
      setPublishingSelected(false);
      return;
    }

    const itemIds = unpublishedItems.map(item => item.id);

    try {
      const response = await fetchWithAuth('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ itemIds }),
      });

      const successfulIds = response.results
        .filter((r: any) => r.success)
        .map((r: any) => r.itemId);

      setItems(prevItems =>
        prevItems.map(item =>
          successfulIds.includes(item.id) ? { ...item, published: true } : item
        )
      );

      // Clear selection after publishing
      setSelectedProducts(new Set());
    } catch (err) {
      console.error('Failed to publish selected products:', err);
    } finally {
      setPublishingSelected(false);
    }
  };

  const stats = {
    generated: items.filter(i => i.status === 'DONE').length,
    pushedToStore: items.filter(i => i.published).length,
    totalQuestions: items.length,
    readyToStore: items.filter(i => i.status === 'DONE' && !i.published).length,
    pendingPush: items.filter(i => i.status === 'DONE' && !i.published).length,
    creditsUsed: items.filter(i => i.status === 'DONE').length,
  };

  // Check if all products are published
  const allProductsPublished = Object.keys(groupedProducts).every(productId => 
    isProductPublished(productId)
  );

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
          <button onClick={() => navigate('/queue')} className="btn-back">
            Back to Queue
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
          <button className="btn-back-arrow" onClick={() => navigate('/queue')}>
            ← Back
          </button>
          <div>
            <h1>Job overview</h1>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-container">
        <div className="stat-box">
          <div className="stat-label">Products</div>
          <div className="stat-value">{Object.keys(groupedProducts).length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Fields</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Credits used</div>
          <div className="stat-value">{stats.creditsUsed}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Language</div>
          <div className="stat-value">{job.targetLang.toUpperCase()}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar-full">
          <div className="progress-fill-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <h2>Results summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Pushed to store</div>
            <div className="summary-value">{stats.pushedToStore}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Pending push</div>
            <div className="summary-value">{stats.pendingPush}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Credits used</div>
            <div className="summary-value">{stats.creditsUsed}</div>
          </div>
        </div>

        <div className="summary-actions">
          <button 
            className="btn-start-optimization"
            onClick={handlePublishAll}
            disabled={publishingAll || stats.pendingPush === 0}
          >
            {publishingAll ? 'Publishing...' : 'Start new optimization'}
          </button>
          <button className="btn-view-completed" onClick={() => navigate('/completed')}>
            View completed jobs
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="configuration-section">
        <div className="config-header" onClick={() => setConfigExpanded(!configExpanded)}>
          <h2>Configuration</h2>
          <button className="btn-expand-config">
            {configExpanded ? '▼' : '▶'}
          </button>
        </div>
        {configExpanded && (
          <div className="config-content">
            <div className="config-item">
              <strong>Selected fields</strong>
              <div className="field-tags">
                {items.map(item => item.attribute).filter((v, i, a) => a.indexOf(v) === i).map(attr => (
                  <span key={attr} className="field-tag">{attr}</span>
                ))}
              </div>
            </div>
            <div className="config-item">
              <strong>Target language</strong>
              <div>{job.targetLang}</div>
            </div>
            <div className="config-item">
              <strong>Custom prompt</strong>
              <div className="custom-prompt">{job.userPrompt || 'No custom prompt provided'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions-section">
        <h2>Bulk Actions</h2>
        <div className="bulk-actions-controls">
          <button 
            className="btn-select-all"
            onClick={handleSelectAll}
            disabled={allProductsPublished}
          >
            Select All
          </button>
          <button 
            className="btn-publish-selected"
            onClick={handlePublishSelected}
            disabled={publishingSelected || selectedProducts.size === 0 || allProductsPublished}
          >
            {publishingSelected ? 'Publishing...' : `Publish Selected (${selectedProducts.size})`}
          </button>
        </div>
      </div>

      {/* Product Items - Grouped by Product */}
      <div className="products-section">
        {Object.entries(groupedProducts).map(([productId, productItems], index) => {
          const allPublished = isProductPublished(productId);
          const isPublishing = isProductPublishing(productId);
          const product = productDetails[productId];
          const productName = product?.name || productId;
          const productImage = product?.media?.mainMedia?.image?.url;
          
          return (
            <div key={productId} className="product-item-card">
              <div className="product-item-header" onClick={() => toggleProduct(productId)}>
                <div className="product-item-info">
                  <input
                    type="checkbox"
                    className="product-checkbox"
                    checked={selectedProducts.has(productId)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleProductSelection(productId);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="product-number">#{index + 1}</span>
                  {productImage && (
                    <img 
                      src={productImage} 
                      alt={productName}
                      className="product-thumbnail"
                    />
                  )}
                  <strong>{productName}</strong>
                </div>
                <div className="product-item-actions">
                  {!allPublished && (
                    <button
                      className="btn-publish-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishProduct(productId);
                      }}
                      disabled={isPublishing}
                    >
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  {allPublished && (
                    <button className="btn-published" disabled>
                      Published
                    </button>
                  )}
                  <button className="btn-expand">
                    {expandedProducts.has(productId) ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {expandedProducts.has(productId) && (
                <div className="product-item-content">
                  {productItems.map((item) => (
                    <div key={item.id} className="field-section">
                      <h4>{item.attribute}</h4>
                      <div className="before-after-grid">
                        <div className="before-column">
                          <h5>Original</h5>
                          <div className="content-box">
                            <p>{item.beforeValue || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="after-column">
                          <h5>Optimized</h5>
                          <div className="content-box">
                            <p>{item.afterValue || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="field-actions">
                    {!allPublished && (
                      <button
                        className="btn-publish-item"
                        onClick={() => handlePublishProduct(productId)}
                        disabled={isPublishing}
                      >
                        {isPublishing ? 'Publishing...' : 'Publish'}
                      </button>
                    )}
                    {allPublished && (
                      <>
                        <button className="btn-published" disabled>
                          Published
                        </button>
                        <button 
                          className="btn-view-in-store"
                          onClick={() => handleViewInStore(productId)}
                        >
                          View in store
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
