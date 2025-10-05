import { Preset } from "../types";

const base = "https://dummyimage.com/320x360/";

export const SYSTEM_STYLE_PRESETS: Preset[] = [
  {
    id: "style-cyberpunk",
    name: "赛博朋克",
    prompt: "futuristic cyberpunk designer toy, neon lights, chrome details, dramatic rim lighting",
    thumbnail: `${base}111827/38bdf8&text=%E8%B5%9B%E5%8D%9A%E6%96%BD`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-cute",
    name: "可爱潮玩",
    prompt: "adorable chibi vinyl figure, soft pastel palette, glossy finish, big expressive eyes",
    thumbnail: `${base}1f2937/f9fafb&text=%E5%8F%AF%E7%88%B1`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-vintage",
    name: "复古机甲",
    prompt: "retro mecha-inspired art toy, worn metal texture, intricate gears, dramatic shadows",
    thumbnail: `${base}0f172a/fcd34d&text=%E6%9C%BA%E7%94%B2`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-fantasy",
    name: "幻想物语",
    prompt: "fantasy creature designer toy, ethereal glow, translucent materials, magical aura",
    thumbnail: `${base}111827/c084fc&text=%E5%B9%BB%E6%83%B3`,
    category: "style",
    isSystem: true
  }
];

export const SYSTEM_MATERIAL_PRESETS: Preset[] = [
  {
    id: "material-pvc",
    name: "PVC",
    prompt: "smooth pvc vinyl, subtle specular highlights, soft shadow",
    thumbnail: `${base}0f172a/60a5fa&text=PVC`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-resin",
    name: "树脂",
    prompt: "artisan resin casting, semi-gloss finish, fine texture details",
    thumbnail: `${base}111827/34d399&text=%E6%A0%91%E8%84%82`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-softvinyl",
    name: "搪胶",
    prompt: "soft vinyl sofubi, gentle gradients, nostalgic color transitions",
    thumbnail: `${base}1f2937/f472b6&text=%E6%90%AA%E8%83%B6`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-metal",
    name: "金属涂装",
    prompt: "airbrushed metallic paint, reflective sheen, contrasted highlights",
    thumbnail: `${base}0f172a/f97316&text=%E9%87%91%E5%B1%82`,
    category: "material",
    isSystem: true
  }
];
