import { Preset } from "../types";

export const SYSTEM_STYLE_PRESETS: Preset[] = [
  {
    id: "style-cyberpunk",
    name: "Cyberpunk Toy",
    prompt:
      "Cyberpunk designer toy bathed in neon lights across metallic details with striking cool-warm rim lighting",
    thumbnail: "/assets/presets/style-cyberpunk-boy.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "赛博朋克潮玩" },
      prompt: {
        zh: "赛博朋克主题潮玩，霓虹灯光照亮金属细节，配以冷暖对比的强烈背光"
      }
    }
  },
  {
    id: "style-cute",
    name: "Soft Dreamscape",
    prompt:
      "Soft chibi designer toy with rounded proportions, pastel macaron palette, and mirror-like glossy finish",
    thumbnail: "/assets/presets/style-cute-girl.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "软萌梦境" },
      prompt: {
        zh: "软萌潮玩造型，饱满的Q版比例，柔和马卡龙色彩与镜面般的光泽质感"
      }
    }
  },
  {
    id: "style-vintage",
    name: "Retro Mecha",
    prompt:
      "Retro mech designer toy with weathered metal panels, exposed gears, and antique golden glow emphasizing heavy machinery",
    thumbnail: "/assets/presets/style-vintage-boy.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "复古机甲" },
      prompt: {
        zh: "复古机甲潮玩，旧化金属与外露齿轮，暗金光晕衬托厚重机械结构"
      }
    }
  },
  {
    id: "style-fantasy",
    name: "Fantasy Tale",
    prompt:
      "Fantasy designer toy character with crystal-like translucent materials and gentle glow forming a magical aura",
    thumbnail: "/assets/presets/style-fantasy-girl.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "幻想物语" },
      prompt: {
        zh: "幻想系潮玩角色，晶莹半透明材质，淡淡发光营造出魔法气场"
      }
    }
  },
  {
    id: "style-steampunk",
    name: "Steampunk Explorer",
    prompt:
      "Steampunk designer toy covered in copper pipes and rivets, goggles and gears highlighting vintage industrial flair",
    thumbnail: "/assets/presets/style-steampunk-boy.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "蒸汽朋克" },
      prompt: {
        zh: "蒸汽朋克潮玩，全身铜色管道与铆钉，护目镜和齿轮强调复古工业气息"
      }
    }
  },
  {
    id: "style-ink",
    name: "Ink Brush Chic",
    prompt:
      "Chinese ink-inspired designer toy with flowing brush-like strokes, splash gradients, dragon patterns, and cloud motifs",
    thumbnail: "/assets/presets/style-ink-panda.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "国潮水墨" },
      prompt: {
        zh: "国潮水墨潮玩，流动墨韵与泼彩渐变交织，龙纹与祥云点缀东方韵味"
      }
    }
  },
  {
    id: "style-space",
    name: "Future Space",
    prompt:
      "Futuristic space designer toy with streamlined helmet, silver-white armor, and fluorescent accents for a high-tech feel",
    thumbnail: "/assets/presets/style-space-girl.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "未来太空" },
      prompt: {
        zh: "未来太空主题潮玩，流线型头盔与银白装甲，荧光细节凸显科技质感"
      }
    }
  },
  {
    id: "style-street",
    name: "Street Graffiti",
    prompt:
      "Street graffiti designer toy with exaggerated gestures, clashing spray-paint textures, and loose lines creating dynamic poses",
    thumbnail: "/assets/presets/style-street-fox.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "街头涂鸦" },
      prompt: {
        zh: "街头涂鸦潮玩，夸张手势搭配撞色喷漆纹理，随性线条形成动感姿态"
      }
    }
  },
  {
    id: "style-fairy",
    name: "Dreamy Fairy",
    prompt:
      "Dreamy fairy designer toy with fluffy skirts, starlight embellishments, and soft lighting for an airy dreamlike mood",
    thumbnail: "/assets/presets/style-fairy-bunny.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "梦幻童话" },
      prompt: {
        zh: "梦幻童话潮玩，蓬松裙摆与星光点缀，柔光包裹营造轻盈梦境感"
      }
    }
  },
  {
    id: "style-handcrafted",
    name: "Handcrafted Wood",
    prompt:
      "Handcrafted wooden designer toy with delicate carved grain and warm lighting highlighting artisan texture",
    thumbnail: "/assets/presets/style-handcrafted-boy.jpeg",
    category: "style",
    isSystem: true,
    translations: {
      name: { zh: "手作原木" },
      prompt: {
        zh: "手作原木潮玩，细腻木纹雕刻与暖色灯光，凸显温润手工质感"
      }
    }
  }
];

export const SYSTEM_MATERIAL_PRESETS: Preset[] = [
  {
    id: "material-pvc",
    name: "PVC",
    prompt: "Smooth PVC material with delicate highlights and soft shadows for a classic designer toy finish",
    thumbnail: "/assets/presets/material-pvc-boy.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      prompt: {
        zh: "平滑的PVC材质，细腻高光与柔和投影呈现经典潮玩质感"
      }
    }
  },
  {
    id: "material-resin",
    name: "Resin",
    prompt: "Hand-poured resin with semi-matte surface preserving intricate textures and dimensional layers",
    thumbnail: "/assets/presets/material-resin-girl.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "树脂" },
      prompt: {
        zh: "手工树脂浇筑，半哑光表面保留细致纹理与立体层次"
      }
    }
  },
  {
    id: "material-softvinyl",
    name: "Soft Vinyl",
    prompt: "Soft vinyl material delivering a gentle tactile feel with classic gradient colors for vintage flair",
    thumbnail: "/assets/presets/material-softvinyl-monster.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "搪胶" },
      prompt: {
        zh: "搪胶材质呈现柔软触感，经典渐变色营造复古收藏风"
      }
    }
  },
  {
    id: "material-metal",
    name: "Metal Coating",
    prompt: "Metallic coating with mirror reflections and strong highlights for a bold, hardcore look",
    thumbnail: "/assets/presets/material-metal-girl.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "金属涂装" },
      prompt: {
        zh: "金属涂装带来镜面反射与强烈高光，为潮玩注入硬核质感"
      }
    }
  },
  {
    id: "material-plush",
    name: "Plush Fabric",
    prompt: "Soft plush material with short fibers for a delicate, huggable touch",
    thumbnail: "/assets/presets/material-plush-bear.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "毛绒织物" },
      prompt: {
        zh: "柔软毛绒材质，短绒纤维细腻可爱，营造抱枕般的亲和触感"
      }
    }
  },
  {
    id: "material-fur",
    name: "Long Flocked Fur",
    prompt: "Long flocked fur wrap with layered strands that catch the light, delivering lively animal texture",
    thumbnail: "/assets/presets/material-fur-cat.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "长毛植绒" },
      prompt: {
        zh: "长毛植绒包覆，丰富的毛发层次随光摆动，呈现生动动物质感"
      }
    }
  },
  {
    id: "material-velvet",
    name: "Velvet Wrap",
    prompt: "Velvet wrap craft with deep luster and silky touch to elevate a premium atmosphere",
    thumbnail: "/assets/presets/material-velvet-girl.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "丝绒包覆" },
      prompt: {
        zh: "丝绒包覆工艺，深邃天鹅绒光泽与柔滑触感提升高级氛围"
      }
    }
  },
  {
    id: "material-acrylic",
    name: "Clear Acrylic",
    prompt:
      "Transparent acrylic material that is crystal clear with luminous refraction, reinforcing a futuristic tech vibe",
    thumbnail: "/assets/presets/material-acrylic-boy.jpeg",
    category: "material",
    isSystem: true,
    translations: {
      name: { zh: "透明亚克力" },
      prompt: {
        zh: "透明亚克力材质，晶莹透亮并带有光晕折射，强化未来科技感"
      }
    }
  }
];
