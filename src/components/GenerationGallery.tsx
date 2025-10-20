import { useTranslation } from "../i18n";
import type { GeneratedArtwork } from "../types";
import "./GenerationGallery.css";

interface GenerationGalleryProps {
  sectionId?: string;
  artworks: GeneratedArtwork[];
  isGenerating: boolean;
  statusMessage: string;
  onDownload: (artwork: GeneratedArtwork) => void;
  onCopyLink: (artwork: GeneratedArtwork) => void;
  onSelect: (artwork: GeneratedArtwork) => void;
}

function GenerationGallery({
  sectionId,
  artworks,
  isGenerating,
  statusMessage,
  onDownload,
  onCopyLink,
  onSelect
}: GenerationGalleryProps) {
  const { t } = useTranslation();

  return (
    <section id={sectionId} className="generation-gallery">
      <div className="section-header">
        <div>
          <h2>{t("gallery.title")}</h2>
          <p>{t("gallery.subtitle")}</p>
        </div>
        {isGenerating && <div className="loading-indicator">{statusMessage}</div>}
      </div>

      {artworks.length === 0 ? (
        <div className="empty-state">
          <h3>{t("gallery.empty.title")}</h3>
          <p>{t("gallery.empty.description")}</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {artworks.map((artwork) => (
            <article className="gallery-card" key={artwork.id}>
              <button
                type="button"
                className="gallery-visual"
                onClick={() => onSelect(artwork)}
                title={t("gallery.view")}
              >
                <img
                  src={artwork.imageUrl}
                  alt={
                    artwork.seed
                      ? t("gallery.seed", { value: artwork.seed })
                      : t("gallery.artwork.alt")
                  }
                  loading="lazy"
                />
              </button>
              <div className="gallery-meta">
                <div>
                  <span className="gallery-seed">
                    {artwork.seed
                      ? t("gallery.seed", { value: artwork.seed })
                      : t("gallery.seed", { value: t("gallery.seed.auto") })}
                  </span>
                  {artwork.sizeLabel && (
                    <span className="gallery-size">{t("gallery.size", { value: artwork.sizeLabel })}</span>
                  )}
                </div>
                <div className="gallery-actions">
                  <button type="button" onClick={() => onDownload(artwork)}>
                    {t("gallery.download")}
                  </button>
                  <button type="button" onClick={() => onCopyLink(artwork)}>
                    {t("gallery.copy")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default GenerationGallery;
