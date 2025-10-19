export type PresetCategory = "style" | "material";

export interface Preset {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
  category: PresetCategory;
  isSystem?: boolean;
}

export interface GenerationTask {
  id: string;
  prompt: string;
  createdAt: string;
  status: "success" | "error" | "pending";
  results: GeneratedArtwork[];
  requestedCount?: number;
  origin?: string;
  sourceArtworkId?: string;
}

export interface GeneratedArtwork {
  id: string;
  imageUrl: string;
  seed?: string;
  sizeLabel?: string;
}
