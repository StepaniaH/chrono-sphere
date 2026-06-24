import { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderCardToBlob, renderCardToDataUrl, downloadBlob } from '../utils/cardExport';
import { CardOffset } from './CardOffset';
import CardInterval from './CardInterval';
import { CardLunar } from './CardLunar';
import type { CardOffsetData, CardIntervalData, CardLunarData } from './CardRenderer';
import { CARD_TEMPLATES, FREE_TEXT_TEMPLATE_ID, fillTemplate, MAX_CUSTOM_TEXT_LENGTH } from '../utils/cardTemplates';
import { translate, type Locale } from '../i18n';

type CardData = CardOffsetData | CardIntervalData | CardLunarData;

interface ShareButtonProps {
  cardType: 'offset' | 'interval' | 'lunar';
  cardData: CardData;
  locale: Locale;
}

/**
 * Derive the numeric day count from card data for {N} template placeholder.
 */
function getDayCount(data: CardData): number {
  if ('offsetDays' in data) return data.offsetDays;
  if ('totalDays' in data) return data.totalDays;
  return 0;
}

/**
 * Capture a card component to blob + dataUrl.
 */
async function captureCardElement(el: HTMLElement): Promise<{ blob: Blob; dataUrl: string }> {
  const [blob, dataUrl] = await Promise.all([
    renderCardToBlob(el),
    renderCardToDataUrl(el),
  ]);
  return { blob, dataUrl };
}

export const ShareButton: React.FC<ShareButtonProps> = ({ cardType, cardData, locale }) => {
  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const [showModal, setShowModal] = useState(false);
  const [templateId, setTemplateId] = useState(0);
  const [customText, setCustomText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Templates available for this card type
  const templates = CARD_TEMPLATES.filter(tmpl => tmpl.tabs.includes(cardType));
  const activeTemplate = CARD_TEMPLATES.find(t => t.id === templateId);

  // Compute effective custom text based on template + user input
  const getEffectiveText = useCallback((): string => {
    if (!activeTemplate || templateId === FREE_TEXT_TEMPLATE_ID) {
      return customText || '';
    }
    const dayCount = getDayCount(cardData);
    const vars: Record<string, string> = { N: String(dayCount) };
    for (const v of activeTemplate.userVars) {
      vars[v] = customText || '...';
    }
    return fillTemplate(activeTemplate, vars);
  }, [templateId, customText, cardData, activeTemplate]);

  // Generate card props with current template text
  const getCardProps = useCallback((): CardData => {
    return { ...cardData, customText: getEffectiveText() } as CardData;
  }, [cardData, getEffectiveText]);

  // Mount and capture card
  const regeneratePreview = useCallback(async () => {
    if (!containerRef.current) return;

    const props = getCardProps();

    // Mount React component
    if (!rootRef.current) {
      rootRef.current = createRoot(containerRef.current);
    }
    rootRef.current.render(
      cardType === 'offset' ? <CardOffset {...(props as CardOffsetData)} /> :
      cardType === 'interval' ? <CardInterval {...(props as CardIntervalData)} /> :
      <CardLunar {...(props as CardLunarData)} />
    );

    // Wait for paint
    await new Promise(r => setTimeout(r, 150));

    try {
      const el = containerRef.current.firstElementChild as HTMLElement;
      if (!el) throw new Error('Card element not found');
      const { blob, dataUrl } = await captureCardElement(el);
      setPreviewBlob(blob);
      setPreviewUrl(dataUrl);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    }
  }, [cardType, getCardProps]);

  // Debounced regeneration when template/text changes
  useEffect(() => {
    if (!showModal) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      regeneratePreview().finally(() => setLoading(false));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [showModal, templateId, customText, regeneratePreview]);

  // Initial capture on modal open
  useEffect(() => {
    if (showModal) {
      setLoading(true);
      // Small delay to let the container mount first
      const t = setTimeout(() => {
        regeneratePreview().finally(() => setLoading(false));
      }, 100);
      return () => clearTimeout(t);
    }
  }, [showModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = () => {
    setTemplateId(0);
    setCustomText('');
    setError('');
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    // Cleanup
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }
    if (containerRef.current && containerRef.current.parentNode) {
      containerRef.current.parentNode.removeChild(containerRef.current);
      containerRef.current = null;
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
    } catch { /* ignore */ }
  };

  const needsTextInput =
    templateId === FREE_TEXT_TEMPLATE_ID ||
    (activeTemplate && activeTemplate.userVars.length > 0);

  return (
    <>
      {/* Trigger button — icon only, circular */}
      <button
        type="button"
        className="share-btn"
        onClick={handleOpen}
        title={t('share.title')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {/* Share modal */}
      {showModal && (
        <div className="share-preview-overlay" onClick={handleClose}>
          <div className="share-preview-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              type="button"
              className="share-preview-close"
              onClick={handleClose}
              aria-label={t('share.close')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Title */}
            <div className="share-modal-title">{t('share.title')}</div>

            {/* Card preview */}
            <div className="share-preview-body">
              {loading && (
                <div className="share-preview-loading">
                  <span className="share-btn-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                </div>
              )}
              {error && <div className="share-preview-error">{error}</div>}
              {previewUrl && !loading && (
                <img
                  src={previewUrl}
                  alt={t('share.preview')}
                  className="share-preview-image"
                />
              )}
            </div>

            {/* Template selector */}
            <div className="share-template-section">
              <div className="share-template-label">
                {locale === 'zh' ? '卡片文案' : 'Card text'}
              </div>
              <div className="share-template-pills">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`share-template-pill ${templateId === tmpl.id ? 'active' : ''}`}
                    onClick={() => { setTemplateId(tmpl.id); setCustomText(''); }}
                  >
                    {locale === 'zh' ? tmpl.labelZh : tmpl.labelEn}
                  </button>
                ))}
                <button
                  type="button"
                  className={`share-template-pill ${templateId === FREE_TEXT_TEMPLATE_ID ? 'active' : ''}`}
                  onClick={() => setTemplateId(FREE_TEXT_TEMPLATE_ID)}
                >
                  {locale === 'zh' ? '自由输入' : 'Custom'}
                </button>
              </div>

              {/* Custom text input */}
              {needsTextInput && (
                <input
                  type="text"
                  className="share-text-input"
                  placeholder={
                    activeTemplate && activeTemplate.userVars.length > 0
                      ? locale === 'zh'
                        ? `输入${activeTemplate.userVars.join('、')}（最多${MAX_CUSTOM_TEXT_LENGTH}字）`
                        : `Enter ${activeTemplate.userVars.join(', ')} (max ${MAX_CUSTOM_TEXT_LENGTH} chars)`
                      : locale === 'zh'
                        ? `输入文案（最多${MAX_CUSTOM_TEXT_LENGTH}字）`
                        : `Enter text (max ${MAX_CUSTOM_TEXT_LENGTH} chars)`
                  }
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, MAX_CUSTOM_TEXT_LENGTH))}
                  maxLength={MAX_CUSTOM_TEXT_LENGTH}
                />
              )}
            </div>

            {/* Actions */}
            <div className="share-preview-actions">
              <button
                type="button"
                className="share-preview-btn primary"
                onClick={handleDownload}
                disabled={!previewBlob}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('share.download')}
              </button>
              <button
                type="button"
                className="share-preview-btn"
                onClick={handleCopyCode}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t('share.copyCode')}
              </button>
            </div>

            {/* Hidden render container */}
            <div
              ref={(el) => {
                if (el && !containerRef.current) {
                  containerRef.current = el;
                }
              }}
              style={{ position: 'absolute', left: '-9999px', top: 0, width: 900 }}
            />
          </div>
        </div>
      )}
    </>
  );
};
