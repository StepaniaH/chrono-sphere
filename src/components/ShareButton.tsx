import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderCardToBlob, renderCardToDataUrl, downloadBlob, shareImage } from '../utils/cardExport';
import { CardOffset } from './CardOffset';
import CardInterval from './CardInterval';
import { CardLunar } from './CardLunar';
import type { CardOffsetData, CardIntervalData, CardLunarData } from './CardRenderer';
import { translate, type Locale } from '../i18n';

type CardData = CardOffsetData | CardIntervalData | CardLunarData;

interface ShareButtonProps {
  cardType: 'offset' | 'interval' | 'lunar';
  cardData: CardData;
  locale: Locale;
  className?: string;
}

/**
 * Temporarily mount a card component to the document body,
 * capture it with html-to-image, then unmount.
 */
async function captureCard(
  type: 'offset' | 'interval' | 'lunar',
  data: CardData,
): Promise<{ blob: Blob; dataUrl: string }> {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;top:0;left:0;width:900px;z-index:99999';
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise((resolve, reject) => {
    // We need to wait for React to render before capturing
    // Use requestAnimationFrame + setTimeout to ensure paint
    const capture = () => {
      requestAnimationFrame(async () => {
        try {
          const blob = await renderCardToBlob(container.firstElementChild as HTMLElement);
          const dataUrl = await renderCardToDataUrl(container.firstElementChild as HTMLElement);
          resolve({ blob, dataUrl });
        } catch (err) {
          reject(err);
        } finally {
          root.unmount();
          document.body.removeChild(container);
        }
      });
    };

    // Render the card component into the container
    root.render(
      type === 'offset' ? <CardOffset {...(data as CardOffsetData)} /> :
      type === 'interval' ? <CardInterval {...(data as CardIntervalData)} /> :
      <CardLunar {...(data as CardLunarData)} />
    );

    // Give React a tick to render, then capture
    setTimeout(capture, 100);
  });
}

export const ShareButton: React.FC<ShareButtonProps> = ({ cardType, cardData, locale, className }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = (key: string) => translate(locale, key);

  const handleShare = async () => {
    setLoading(true);
    setError('');

    try {
      const { blob, dataUrl } = await captureCard(cardType, cardData);
      setPreviewBlob(blob);
      setPreviewUrl(dataUrl);

      // Try Web Share first
      const shared = await shareImage(blob, 'ChronoSphere');
      if (!shared) {
        // Fallback: show preview modal
        setShowPreview(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate card');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (previewBlob) {
      downloadBlob(previewBlob, `chrono-card-${Date.now()}.png`);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cardData.code);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Share button */}
      <button
        type="button"
        className={`share-btn ${className ?? ''}`}
        onClick={handleShare}
        disabled={loading}
        title={t('share.title')}
      >
        {loading ? (
          <span className="share-btn-spinner" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
        <span>{t('share.button')}</span>
      </button>

      {error && <div className="share-error">{error}</div>}

      {/* Preview modal (fallback for desktop / unsupported browsers) */}
      {showPreview && (
        <div className="share-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="share-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="share-preview-close"
              onClick={() => setShowPreview(false)}
              aria-label={t('share.close')}
            >
              ×
            </button>
            <img
              src={previewUrl}
              alt={t('share.preview')}
              className="share-preview-image"
            />
            <div className="share-preview-actions">
              <button type="button" className="share-preview-btn primary" onClick={handleDownload}>
                {t('share.download')}
              </button>
              <button type="button" className="share-preview-btn" onClick={handleCopyCode}>
                {t('share.copyCode')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
