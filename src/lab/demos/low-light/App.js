import { useEffect, useRef, useState } from "react";
import { LOCALE } from "./locale.js";
import { drawNightScene } from "./scene.js";
import { clahe, equalize, gammaCorrect, grayscale, histogram, luminance } from "./enhance.js";

const TEXT = {
  en: {
    modes: { original: "Original", gray: "Grayscale", gamma: "Gamma", equalize: "Hist. EQ", clahe: "CLAHE-lite" },
    before: "Before",
    after: "After",
    gamma: "Gamma",
    clip: "Clip limit",
    tiles: "Tile grid",
    upload: "Upload image",
    reset: "Synthetic scene",
    note: "Histograms show luminance (0 = black, 255 = white). Nothing is uploaded: the image stays in this page.",
  },
  zh: {
    modes: { original: "原图", gray: "灰度", gamma: "伽马校正", equalize: "直方图均衡", clahe: "CLAHE 简化版" },
    before: "处理前",
    after: "处理后",
    gamma: "伽马值",
    clip: "限幅阈值",
    tiles: "分块网格",
    upload: "上传图片",
    reset: "合成测试图",
    note: "直方图显示亮度分布（0 为黑，255 为白）。图片只在本页面内处理，不会上传。",
  },
};
const t = TEXT[LOCALE] || TEXT.en;

const MAX_W = 320;
const MAX_H = 240;

function drawHistogram(canvas, pixels, color) {
  const hist = histogram(luminance(pixels));
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  // Scale to the 2nd-highest bin so one huge spike does not flatten the rest.
  const sorted = Array.from(hist).sort((a, b) => b - a);
  const peak = Math.max(1, sorted[1]);
  ctx.fillStyle = color;
  for (let v = 0; v < 256; v++) {
    const bar = Math.min(1, hist[v] / peak) * height;
    ctx.fillRect(v, height - bar, 1, bar);
  }
}

export default function App() {
  const [mode, setMode] = useState("clahe");
  const [gamma, setGamma] = useState(0.45);
  const [clip, setClip] = useState(3);
  const [tiles, setTiles] = useState(8);
  const [source, setSource] = useState(null); // ImageData
  const before = useRef(null);
  const after = useRef(null);
  const histBefore = useRef(null);
  const histAfter = useRef(null);

  function loadScene() {
    const canvas = document.createElement("canvas");
    canvas.width = MAX_W;
    canvas.height = 200;
    setSource(drawNightScene(canvas, { exposure: 0.22, noise: 5 }));
  }

  useEffect(loadScene, []);

  function onFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_W / img.width, MAX_H / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setSource(ctx.getImageData(0, 0, canvas.width, canvas.height));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  useEffect(() => {
    if (!source) return;
    const { width, height, data } = source;
    let out = data;
    if (mode === "gray") out = grayscale(data);
    if (mode === "gamma") out = gammaCorrect(data, gamma);
    if (mode === "equalize") out = equalize(data);
    if (mode === "clahe") out = clahe(data, width, height, tiles, clip);

    for (const canvas of [before.current, after.current]) {
      canvas.width = width;
      canvas.height = height;
    }
    before.current.getContext("2d").putImageData(source, 0, 0);
    after.current.getContext("2d").putImageData(new ImageData(out, width, height), 0, 0);
    drawHistogram(histBefore.current, data, "#9aa0b4");
    drawHistogram(histAfter.current, out, "#6ee7f2");
  }, [source, mode, gamma, clip, tiles]);

  return (
    <main>
      <div className="row">
        {Object.keys(t.modes).map((key) => (
          <button key={key} aria-pressed={mode === key} onClick={() => setMode(key)}>
            {t.modes[key]}
          </button>
        ))}
      </div>

      <label className={mode === "gamma" ? "slider" : "slider off"}>
        {t.gamma}
        <input type="range" min="0.2" max="1" step="0.01" value={gamma}
          disabled={mode !== "gamma"} onChange={(e) => setGamma(Number(e.target.value))} />
        <output>{gamma.toFixed(2)}</output>
      </label>
      <label className={mode === "clahe" ? "slider" : "slider off"}>
        {t.clip}
        <input type="range" min="1" max="10" step="0.5" value={clip}
          disabled={mode !== "clahe"} onChange={(e) => setClip(Number(e.target.value))} />
        <output>{clip.toFixed(1)}</output>
      </label>
      <label className={mode === "clahe" ? "slider" : "slider off"}>
        {t.tiles}
        <input type="range" min="2" max="16" step="1" value={tiles}
          disabled={mode !== "clahe"} onChange={(e) => setTiles(Number(e.target.value))} />
        <output>{tiles}×{tiles}</output>
      </label>

      <div className="pair">
        <figure>
          <figcaption>{t.before}</figcaption>
          <canvas ref={before} />
          <canvas ref={histBefore} className="hist" width="256" height="56" />
        </figure>
        <figure>
          <figcaption>{t.after} · {t.modes[mode]}</figcaption>
          <canvas ref={after} />
          <canvas ref={histAfter} className="hist" width="256" height="56" />
        </figure>
      </div>

      <div className="row">
        <label className="file">
          {t.upload}
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        <button onClick={loadScene}>{t.reset}</button>
      </div>
      <p className="note">{t.note}</p>
    </main>
  );
}
