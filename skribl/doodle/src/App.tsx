//@ts-nocheck
import React, { useEffect, useRef, useState } from "react";

// Single-file, production-ready drawing app with:
// - Pen with adjustable size
// - Color picker
// - Fill (bucket) tool
// - Eraser
// - Clear & Download
// - Mouse + touch (pointer) support
// - DPR-aware crisp rendering

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [tool, setTool] = useState("pen"); // 'pen' | 'fill' | 'eraser'
  const [color, setColor] = useState("#111827"); // slate-900 default
  const [size, setSize] = useState(8);

  // Setup canvas & DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const cssWidth = canvas.clientWidth || 600;
      const cssHeight = canvas.clientHeight || 800;
      // If no CSS size, fall back to attributes
      const targetCssW = canvas.getAttribute("width") ? parseInt(canvas.getAttribute("width"), 10) : cssWidth;
      const targetCssH = canvas.getAttribute("height") ? parseInt(canvas.getAttribute("height"), 10) : cssHeight;

      canvas.width = targetCssW * ratio;
      canvas.height = targetCssH * ratio;
      canvas.style.width = `${targetCssW}px`;
      canvas.style.height = `${targetCssH}px`;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
      // Optional: background as transparent (default). If you want white bg:
      // ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, targetCssW, targetCssH);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Utility: get pointer position in CSS pixel space
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return { x, y };
  };

  // Begin drawing path
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // only primary
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);

    if (tool === "fill") {
      const { x, y } = getPos(e);
      floodFillAt(Math.floor(x), Math.floor(y), color);
      return; // no path drawing for fill
    }

    const ctx = ctxRef.current;
    isDrawingRef.current = true;
    const { x, y } = getPos(e);
    lastPointRef.current = { x, y };

    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 0.001); // tiny line to create a dot on tap
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const ctx = ctxRef.current;
    const { x, y } = getPos(e);
    const { x: lx, y: ly } = lastPointRef.current;

    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e) => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // --- Flood Fill (Queue-based) ---
  const hexToRGBA32 = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b, 255];
  };

  const floodFillAt = (x, y, hexColor) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Bounds check
    if (x < 0 || y < 0 || x >= w || y >= h) return;

    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data; // Uint8ClampedArray

    const startIdx = (y * w + x) * 4;
    const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];
    const replacement = hexToRGBA32(hexColor);

    // If target color == replacement color, no-op
    if (target[0] === replacement[0] && target[1] === replacement[1] && target[2] === replacement[2] && target[3] === replacement[3]) {
      return;
    }

    // Helper to compare pixel equals target
    const equalsTarget = (idx) => (
      data[idx] === target[0] &&
      data[idx + 1] === target[1] &&
      data[idx + 2] === target[2] &&
      data[idx + 3] === target[3]
    );

    const setPixel = (idx) => {
      data[idx] = replacement[0];
      data[idx + 1] = replacement[1];
      data[idx + 2] = replacement[2];
      data[idx + 3] = replacement[3];
    };

    const q = [];
    q.push([x, y]);

    while (q.length) {
      const [cx, cy] = q.pop();
      let idx = (cy * w + cx) * 4;
      if (!equalsTarget(idx)) continue;

      // move left
      let lx = cx;
      do {
        lx--;
        idx -= 4;
      } while (lx >= 0 && equalsTarget(idx));
      lx++;
      idx += 4;

      // move right, filling line and enqueueing N/S
      let rx = cx;
      while (rx < w && equalsTarget(idx)) {
        setPixel(idx);
        // north
        if (cy > 0) {
          const nIdx = ((cy - 1) * w + rx) * 4;
          if (equalsTarget(nIdx)) q.push([rx, cy - 1]);
        }
        // south
        if (cy < h - 1) {
          const sIdx = ((cy + 1) * w + rx) * 4;
          if (equalsTarget(sIdx)) q.push([rx, cy + 1]);
        }
        rx++;
        idx += 4;
      }
    }

    ctx.putImageData(img, 0, 0);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900">
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-3">Drawing App</h1>
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white rounded-2xl shadow">
          <label className="flex items-center gap-2 text-sm">
            <span>Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer"
              aria-label="Pen color"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span>Size</span>
            <input
              type="range"
              min={1}
              max={64}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="w-40"
              aria-label="Pen size"
            />
            <span className="tabular-nums text-xs w-8 text-center">{size}</span>
          </label>

          <div className="flex items-center gap-2">
            <ToolButton active={tool === "pen"} onClick={() => setTool("pen")}>Pen</ToolButton>
            <ToolButton active={tool === "fill"} onClick={() => setTool("fill")}>Fill</ToolButton>
            <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")}>Eraser</ToolButton>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearCanvas} className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-sm">Clear</button>
            <button onClick={downloadPNG} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-black text-white text-sm">Download</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-3">
          <div className="relative">
            <canvas
              ref={canvasRef}
              id="canvas"
              width={600}
              height={800}
              className="w-[600px] h-[800px] touch-none rounded-xl border border-neutral-200 bg-[conic-gradient(at_50%_120%,#fff,#f6f6f6_25%,#fff_50%,#f6f6f6_75%,#fff)]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">Tip: Use Fill to bucket-fill an enclosed area. Eraser removes pixels. Works with mouse or touch.</p>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-xl text-sm border",
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

