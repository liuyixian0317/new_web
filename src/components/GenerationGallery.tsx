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
  return (
    <section id={sectionId} className="generation-gallery">
      <div className="section-header">
        <div>
          <h2>你的潮玩设计</h2>
          <p>生成的图片将在此展示，可进行下载或复制链接。</p>
        </div>
        {isGenerating && <div className="loading-indicator">{statusMessage}</div>}
      </div>

      {artworks.length === 0 ? (
        <div className="empty-state">
          <h3>等待你的创意火花</h3>
          <p>
            请在左侧输入创意描述并选择风格/材质后点击“生成”，AI会为你带来多张潮玩效果图。
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {artworks.map((artwork) => (
            <article className="gallery-card" key={artwork.id}>
              <button
                type="button"
                className="gallery-visual"
                onClick={() => onSelect(artwork)}
                title="查看详情并继续创作"
              >
                <img src={artwork.imageUrl} alt={artwork.seed ?? "潮玩设计图"} loading="lazy" />
              </button>
              <div className="gallery-meta">
                <div>
                  <span className="gallery-seed">Seed: {artwork.seed ?? "自动生成"}</span>
                  {artwork.sizeLabel && <span className="gallery-size">尺寸: {artwork.sizeLabel}</span>}
                </div>
                <div className="gallery-actions">
                  <button type="button" onClick={() => onDownload(artwork)}>
                    下载
                  </button>
                  <button type="button" onClick={() => onCopyLink(artwork)}>
                    复制链接
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
