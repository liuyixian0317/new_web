import { Preset } from "../types";

const base = "https://dummyimage.com/320x360/";

export const SYSTEM_STYLE_PRESETS: Preset[] = [
  {
    id: "style-cyberpunk",
    name: "赛博朋克潮玩",
    prompt: "赛博朋克主题潮玩，霓虹灯光照亮金属细节，配以冷暖对比的强烈背光",
    thumbnail: `${base}111827/38bdf8&text=${encodeURIComponent("赛博")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-cute",
    name: "软萌梦境",
    prompt: "软萌潮玩造型，饱满的Q版比例，柔和马卡龙色彩与镜面般的光泽质感",
    thumbnail: `${base}1f2937/f9fafb&text=${encodeURIComponent("梦境")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-vintage",
    name: "复古机甲",
    prompt: "复古机甲潮玩，旧化金属与外露齿轮，暗金光晕衬托厚重机械结构",
    thumbnail: `${base}0f172a/fcd34d&text=${encodeURIComponent("机甲")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-fantasy",
    name: "幻想物语",
    prompt: "幻想系潮玩角色，晶莹半透明材质，淡淡发光营造出魔法气场",
    thumbnail: `${base}111827/c084fc&text=${encodeURIComponent("幻想")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-steampunk",
    name: "蒸汽朋克",
    prompt: "蒸汽朋克潮玩，全身铜色管道与铆钉，护目镜和齿轮强调复古工业气息",
    thumbnail: `${base}312e81/f59e0b&text=${encodeURIComponent("蒸汽")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-ink",
    name: "国潮水墨",
    prompt: "国潮水墨潮玩，流动墨韵与泼彩渐变交织，龙纹与祥云点缀东方韵味",
    thumbnail: `${base}14532d/34d399&text=${encodeURIComponent("水墨")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-space",
    name: "未来太空",
    prompt: "未来太空主题潮玩，流线型头盔与银白装甲，荧光细节凸显科技质感",
    thumbnail: `${base}164e63/60a5fa&text=${encodeURIComponent("太空")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-street",
    name: "街头涂鸦",
    prompt: "街头涂鸦潮玩，夸张手势搭配撞色喷漆纹理，随性线条形成动感姿态",
    thumbnail: `${base}111827/f97316&text=${encodeURIComponent("涂鸦")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-fairy",
    name: "梦幻童话",
    prompt: "梦幻童话潮玩，蓬松裙摆与星光点缀，柔光包裹营造轻盈梦境感",
    thumbnail: `${base}4a044e/fbcfe8&text=${encodeURIComponent("童话")}`,
    category: "style",
    isSystem: true
  },
  {
    id: "style-handcrafted",
    name: "手作原木",
    prompt: "手作原木潮玩，细腻木纹雕刻与暖色灯光，凸显温润手工质感",
    thumbnail: `${base}1f2937/facc15&text=${encodeURIComponent("原木")}`,
    category: "style",
    isSystem: true
  }
];

export const SYSTEM_MATERIAL_PRESETS: Preset[] = [
  {
    id: "material-pvc",
    name: "PVC",
    prompt: "平滑的PVC材质，细腻高光与柔和投影呈现经典潮玩质感",
    thumbnail: `${base}0f172a/60a5fa&text=PVC`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-resin",
    name: "树脂",
    prompt: "手工树脂浇筑，半哑光表面保留细致纹理与立体层次",
    thumbnail: `${base}111827/34d399&text=%E6%A0%91%E8%84%82`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-softvinyl",
    name: "搪胶",
    prompt: "搪胶材质呈现柔软触感，经典渐变色营造复古收藏风",
    thumbnail: `${base}1f2937/f472b6&text=%E6%90%AA%E8%83%B6`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-metal",
    name: "金属涂装",
    prompt: "金属涂装带来镜面反射与强烈高光，为潮玩注入硬核质感",
    thumbnail: `${base}0f172a/f97316&text=%E9%87%91%E5%B1%82`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-plush",
    name: "毛绒织物",
    prompt: "柔软毛绒材质，短绒纤维细腻可爱，营造抱枕般的亲和触感",
    thumbnail: `${base}1e293b/facc15&text=${encodeURIComponent("毛绒")}`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-fur",
    name: "长毛植绒",
    prompt: "长毛植绒包覆，丰富的毛发层次随光摆动，呈现生动动物质感",
    thumbnail: `${base}111827/c084fc&text=${encodeURIComponent("植绒")}`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-velvet",
    name: "丝绒包覆",
    prompt: "丝绒包覆工艺，深邃天鹅绒光泽与柔滑触感提升高级氛围",
    thumbnail: `${base}312e81/38bdf8&text=${encodeURIComponent("丝绒")}`,
    category: "material",
    isSystem: true
  },
  {
    id: "material-acrylic",
    name: "透明亚克力",
    prompt: "透明亚克力材质，晶莹透亮并带有光晕折射，强化未来科技感",
    thumbnail: `${base}0f172a/67e8f9&text=${encodeURIComponent("亚克力")}`,
    category: "material",
    isSystem: true
  }
];
