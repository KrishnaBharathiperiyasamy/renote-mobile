export type FrameKey =
  | "frame0" | "frame1" | "frame2" | "frame3" | "frame4" | "frame5"
  | "frame6" | "frame7" | "frame8" | "frame9"
  | "frame10" | "frame11" | "frame12" | "frame13"
  | "frame14" | "frame15" | "frame16" | "frame17" | "frame18" | "frame19" | "frame20" | "frame21" | "frame22" | "frame23" | "frame24" | "frame25" | "frame26";

export interface TemplatePreviewProps {
  templateKey: FrameKey;
  selectedTemplate: FrameKey;
  onSelect: (key: FrameKey) => void;
  layout?: "media-only" | "desc-left" | "desc-right" | "product" | "product-alt" | "frame5"
    | "hero-banner" | "magazine" | "catalog" | "showcase" | "grid"
    | "minimal-clean" | "split-diagonal" | "split-diagonal-alt" | "polaroid" | "billboard" | "centered-circle"
    | "price-tag" | "side-logo" | "overlay-text" | "duo-panel" | "stamp"
    | "card-stack" | "ribbon" | "window-grid" | "spotlight" | "corner-logo"
    | "text-heavy" | "badge" | "flip-card" | "mosaic" | "floating"
    | "full-spread" | "column" | "header-logo" | "quotation" | "three-column"
    | "bottom-bar" | "framed" | "top-strip" | "logo-wall" | "arch"
    | "specs-grid" | "hero-split" | "dark-showcase" | "config-cards" | "banner-pro"
    | "tech-spec" | "diamond-grid" | "neon-frame" | "magazine-spread" | "premium-card"
    | "spotlight-burst";
}