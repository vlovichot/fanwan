// OG 分享图生成：cf-workers-og（Satori + resvg WASM）渲染 1200×630 PNG
// 中文字体从 R2 加载（不打包进 Worker，控制体积），模块级缓存字体字节。
import { ImageResponse, CustomFont } from "cf-workers-og/html";

const FONT_NAME = "NotoSansSC";
const fontCache = new Map(); // R2_FONT_KEY -> ArrayBuffer

async function loadFont(bucket, key) {
  if (fontCache.has(key)) return fontCache.get(key);
  const obj = await bucket.get(key);
  if (!obj) return null;
  const buf = await obj.arrayBuffer();
  fontCache.set(key, buf);
  return buf;
}

// 去掉 emoji 等非常规字符，避免 OG 图渲染出豆腐块
function stripEmoji(s) {
  return String(s).replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}\u{1FA00}-\u{1FAFF}]/gu,
    ""
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// 饭碗插画（右侧大碗 + 米粒 + 筷子 + 小辣椒）
function bowlIllustration() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
  <ellipse cx="210" cy="362" rx="162" ry="36" fill="#f4e3c0"/>
  <g stroke="#7aa5c4" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.8">
    <path d="M176 108 q-14 -20 0 -38 q14 -18 0 -36"/>
    <path d="M232 106 q-14 -20 0 -38 q14 -18 0 -36"/>
  </g>
  <g transform="rotate(-24 92 210)">
    <rect x="82" y="168" width="16" height="108" rx="8" fill="#9db8cc"/>
    <ellipse cx="90" cy="146" rx="23" ry="30" fill="#c9d9e6" stroke="#9db8cc" stroke-width="5"/>
  </g>
  <path d="M56 266 Q210 368 364 266 L344 336 Q210 414 76 336 Z" fill="#ffffff" stroke="#2f6db3" stroke-width="7"/>
  <g fill="#2f6db3" opacity="0.85">
    <circle cx="136" cy="318" r="7"/>
    <circle cx="182" cy="338" r="7"/>
    <circle cx="232" cy="340" r="7"/>
    <circle cx="276" cy="322" r="7"/>
  </g>
  <g fill="#5b93d6">
    <circle cx="210" cy="306" r="9"/>
    <circle cx="189" cy="292" r="6"/>
    <circle cx="231" cy="292" r="6"/>
    <circle cx="210" cy="282" r="6"/>
  </g>
  <path d="M146 386 Q210 404 274 386 L264 402 Q210 420 156 402 Z" fill="#2f6db3"/>
  <ellipse cx="210" cy="258" rx="154" ry="60" fill="#fdfefe" stroke="#2f6db3" stroke-width="7"/>
  <ellipse cx="210" cy="258" rx="136" ry="48" fill="none" stroke="#5b93d6" stroke-width="4"/>
  <g fill="#ffffff" stroke="#d7dee3" stroke-width="2.4">
    <ellipse cx="144" cy="250" rx="37" ry="19"/>
    <ellipse cx="278" cy="250" rx="37" ry="19"/>
    <ellipse cx="178" cy="278" rx="35" ry="17"/>
    <ellipse cx="244" cy="278" rx="35" ry="17"/>
  </g>
  <path d="M168 222 q18 -20 46 -14 q32 -6 42 14 q18 18 -4 32 q-14 18 -42 10 q-28 6 -42 -10 q-18 -14 0 -32 Z" fill="#fffef8" stroke="#e8ddc0" stroke-width="3"/>
  <circle cx="212" cy="236" r="23" fill="#f59e0b"/>
  <circle cx="212" cy="236" r="16" fill="#fbbf24"/>
  <circle cx="205" cy="229" r="5" fill="#fde68a"/>
  <g fill="#34a853">
    <rect x="132" y="228" width="12" height="6" rx="3" transform="rotate(24 138 231)"/>
    <rect x="280" y="226" width="12" height="6" rx="3" transform="rotate(-18 286 229)"/>
    <rect x="172" y="204" width="12" height="6" rx="3" transform="rotate(40 178 207)"/>
    <rect x="256" y="204" width="12" height="6" rx="3" transform="rotate(-32 262 207)"/>
    <rect x="210" y="272" width="12" height="6" rx="3" transform="rotate(12 216 275)"/>
  </g>
</svg>`;
}

// 饭碗儿 Logo（小碗，OG 图左上角用）
function logoDataUri() {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <!-- 饭碗儿 Logo（本站定制）：青花瓷碗 + 荷包蛋 + 勺子 -->
  <ellipse cx="48" cy="82" rx="36" ry="8" fill="#ecd9b0"/>
  <!-- 勺子 -->
  <g transform="rotate(-24 22 46)">
    <rect x="19" y="34" width="5" height="26" rx="2.5" fill="#9db8cc"/>
    <ellipse cx="21.5" cy="28" rx="7" ry="9" fill="#c9d9e6" stroke="#9db8cc" stroke-width="2"/>
  </g>
  <!-- 碗身 -->
  <path d="M13 60 Q48 85 83 60 L79 77 Q48 95 17 77 Z" fill="#ffffff" stroke="#2f6db3" stroke-width="3"/>
  <g fill="#2f6db3" opacity="0.85">
    <circle cx="34" cy="72" r="2.2"/>
    <circle cx="48" cy="76" r="2.2"/>
    <circle cx="62" cy="72" r="2.2"/>
  </g>
  <!-- 碗口 -->
  <ellipse cx="48" cy="58" rx="35" ry="14" fill="#fdfefe" stroke="#2f6db3" stroke-width="2.6"/>
  <ellipse cx="48" cy="58" rx="29" ry="10.5" fill="none" stroke="#5b93d6" stroke-width="1.6"/>
  <!-- 米饭 -->
  <g fill="#ffffff" stroke="#d7dee3" stroke-width="1">
    <ellipse cx="36" cy="55" rx="7" ry="4"/>
    <ellipse cx="60" cy="55" rx="7" ry="4"/>
  </g>
  <!-- 蛋黄 -->
  <circle cx="48" cy="53" r="7" fill="#f59e0b"/>
  <circle cx="48" cy="53" r="4.4" fill="#fbbf24"/>
  <!-- 葱花 -->
  <g fill="#34a853">
    <rect x="30" y="46" width="5" height="2.4" rx="1.2" transform="rotate(24 32 47)"/>
    <rect x="62" y="46" width="5" height="2.4" rx="1.2" transform="rotate(-20 64 47)"/>
  </g>
</svg>`);
}

// 生成 OG 图 HTML（Satori 子集：flexbox + 基础样式）
export function ogHtml({ title, currentYuan, targetYuan, percent, statusText }) {
  const t = stripEmoji(title).slice(0, 50) || "今天想吃口饭";
  const c = Number(currentYuan || 0).toFixed(0);
  const g = Number(targetYuan || 0).toFixed(0);
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const barColor = p >= 100 ? "#e23a3a" : "#e8a33d";
  const status = statusText || (p >= 100 ? "吃饱喽！收碗！" : "还在讨生活");
  const state = p >= 100 ? "吃饱喽！" : p >= 90 ? "差最后一口" : p >= 60 ? "马上吃饱" : p >= 30 ? "饭有着落了" : p > 0 ? "开始有饭了" : "还没吃上一口";

  return `<div style="display:flex; flex-direction:row; width:1200px; height:630px; background:#fbf4e4; padding:64px 72px; font-family:'${FONT_NAME}'">
    <div style="display:flex; flex-direction:column; flex:1; justify-content:space-between; height:100%;">
      <div style="display:flex; flex-direction:row; align-items:center; gap:16px;">
        <img src="${logoDataUri()}" style="width:56px; height:56px;" />
        <span style="font-size:30px; color:#a5712f;">饭碗儿</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:24px;">
        <div style="font-size:52px; line-height:1.35; color:#5a4632; font-weight:700; max-width:640px; display:flex; flex-wrap:wrap;">${escapeHtml(t)}</div>
        <div style="display:flex; flex-direction:row; align-items:baseline; gap:6px; font-size:30px; color:#8a6d4d;"><span style="color:#d98a1f; font-weight:700;">${state}</span> · ¥${c} / ¥${g}</div>
        <div style="display:flex; flex-direction:row; align-items:center; gap:20px;">
          <div style="display:flex; flex:1; height:22px; background:#efe0c0; border-radius:11px; overflow:hidden;">
            <div style="width:${p}%; height:100%; background:${barColor}; border-radius:11px;"></div>
          </div>
          <span style="font-size:32px; color:#a5712f; font-weight:700;">${p}%</span>
        </div>
        <div style="display:flex; font-size:28px; color:#a5712f;">${escapeHtml(status)}</div>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:16px;">
      <img src="${svgDataUri(bowlIllustration())}" style="width:420px; height:420px;" />
      <span style="font-size:26px; color:#c9a86b;">饭碗儿</span>
    </div>
  </div>`;
}

// 渲染 PNG（返回 Response）
export async function renderOg(env, data) {
  const fontKey = env.R2_FONT_KEY || "fonts/NotoSansSC-Regular.otf";
  const fontBuf = await loadFont(env.BUCKET, fontKey);
  const fonts = fontBuf
    ? [new CustomFont(FONT_NAME, fontBuf, { weight: 400 })]
    : undefined; // 没配字体也能出图（英文/数字），中文会变豆腐块，README 会说明

  return ImageResponse.create(ogHtml(data), {
    width: 1200,
    height: 630,
    fonts,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=600",
    },
  });
}
