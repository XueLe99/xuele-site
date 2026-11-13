import { useEffect, useRef, useState } from "react";
import { LOCALE } from "./locale.js";
import { drawNightScene } from "./scene.js";
import { PRESETS, convolve, sobelMagnitude, toGray, toPixels } from "./convolve.js";

const TEXT = {
  en: {
    presets: { identity: "Identity", sobelX: "Sobel X", sobelY: "Sobel Y", sobelMag: "Sobel magnitude", sharpen: "Sharpen", boxBlur: "Box blur", emboss: "Emboss" },
    kernel: "Kernel",
    divisor: "Divisor",
    gray: "Grayscale input",
    absolute: "Absolute value",
    input: "Input",
    output: "Output",
    custom: "custom",
    magnitude: "Sobel magnitude combines the X and Y kernels: √(Gx² + Gy²). Edit a number to go back to a single kernel.",
    note: "out = Σ kernel × neighbours ÷ divisor. Edit any number and the output updates.",
  },
  zh: {
    presets: { identity: "恒等", sobelX: "Sobel X", sobelY: "Sobel Y", sobelMag: "Sobel 梯度幅值", sharpen: "锐化", boxBlur: "均值模糊", emboss: "浮雕" },
    kernel: "卷积核",
    divisor: "除数",
    gray: "灰度输入",
    absolute: "取绝对值",
    input: "输入",
    output: "输出",
    custom: "自定义",
    magnitude: "Sobel 梯度幅值同时使用 X 与 Y 两个卷积核：√(Gx² + Gy²)。修改任意数字即回到单核模式。",
    note: "输出 = Σ 卷积核 × 邻域像素 ÷ 除数。修改任意数字，输出实时更新。",
  },
};
const t = TEXT[LOCALE] || TEXT.en;

const W = 320;
const H = 200;

export default function App() {
  const [preset, setPreset] = useState("sobelMag");
  // Kept as strings so that "-" or "0." can be typed without being rewritten.
  const [cells, setCells] = useState(PRESETS.sobelMag.kernel.map(String));
  const [divisor, setDivisor] = useState("1");
  const [gray, setGray] = useState(true);
  const [absolute, setAbsolute] = useState(false);
  const [source, setSource] = useState(null);
  const input = useRef(null);
  const output = useRef(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    setSource(drawNightScene(canvas, { exposure: 1, noise: 2 }));
  }, []);

  function choose(name) {
    const p = PRESETS[name];
    setPreset(name);
    setCells(p.kernel.map(String));
    setDivisor(String(p.divisor));
    setAbsolute(Boolean(p.absolute));
  }

  function editCell(index, value) {
    setCells(cells.map((c, i) => (i === index ? value : c)));
    setPreset(null);
  }

  const magnitude = preset === "sobelMag";

  useEffect(() => {
    if (!source) return;
    const src = gray ? toGray(source.data) : source.data;
    const kernel = cells.map((c) => Number(c) || 0);
    const values = magnitude
      ? sobelMagnitude(src, W, H)
      : convolve(src, W, H, kernel, Number(divisor) || 1);
    input.current.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(src), W, H), 0, 0);
    output.current.getContext("2d").putImageData(new ImageData(toPixels(values, absolute), W, H), 0, 0);
  }, [source, cells, divisor, gray, absolute, magnitude]);

  return (
    <main>
      <div className="row">
        {Object.keys(PRESETS).map((name) => (
          <button key={name} aria-pressed={preset === name} onClick={() => choose(name)}>
            {t.presets[name]}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="kernel" role="group" aria-label={t.kernel}>
          {cells.map((value, i) => (
            <input key={i} inputMode="decimal" value={value} aria-label={`${t.kernel} ${i + 1}`}
              onChange={(e) => editCell(i, e.target.value)} />
          ))}
        </div>
        <div className="side">
          <label>
            {t.divisor}{" "}
            <input className="num" inputMode="decimal" value={divisor} disabled={magnitude}
              onChange={(e) => { setDivisor(e.target.value); setPreset(null); }} />
          </label>
          <label className="check">
            <input type="checkbox" checked={gray} onChange={(e) => setGray(e.target.checked)} />
            {t.gray}
          </label>
          <label className="check">
            <input type="checkbox" checked={absolute} disabled={magnitude}
              onChange={(e) => setAbsolute(e.target.checked)} />
            {t.absolute}
          </label>
        </div>
      </div>

      <div className="pair">
        <figure>
          <figcaption>{t.input}</figcaption>
          <canvas ref={input} width={W} height={H} />
        </figure>
        <figure>
          <figcaption>{t.output} · {preset ? t.presets[preset] : t.custom}</figcaption>
          <canvas ref={output} width={W} height={H} />
        </figure>
      </div>
      <p className="note">{magnitude ? t.magnitude : t.note}</p>
    </main>
  );
}
