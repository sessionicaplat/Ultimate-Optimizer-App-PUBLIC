import { useEffect } from 'react';
import './BeforeAfterDrawer.css';

interface JobItem {
  id: number;
  productId: string;
  attribute: string;
  beforeValue: string | null;
  afterValue: string | null;
}

interface BeforeAfterDrawerProps {
  item: JobItem;
  onClose: () => void;
  onPublish: (itemId: number) => void;
  isPublishing: boolean;
}

export default function BeforeAfterDrawer({
  item,
  onClose,
  onPublish,
  isPublishing,
}: BeforeAfterDrawerProps) {
  useEffect(() => {
    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="drawer-backdrop" onClick={handleBackdropClick}>
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h2>Product {item.productId}</h2>
            <p className="drawer-subtitle">
              Attribute: <span className="attribute-tag">{item.attribute}</span>
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-content">
          <div className="comparison-container">
            <div className="comparison-column">
              <h3 className="column-title before-title">Before</h3>
              <div className="content-box before-box">
                <p>{item.beforeValue || 'N/A'}</p>
              </div>
            </div>

            <div className="comparison-divider">
              <div className="arrow">→</div>
            </div>

            <div className="comparison-column">
              <h3 className="column-title after-title">After (AI Optimized)</h3>
              <div className="content-box after-box">
                <p>{item.afterValue || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="publish-drawer-btn"
            onClick={() => onPublish(item.id)}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
