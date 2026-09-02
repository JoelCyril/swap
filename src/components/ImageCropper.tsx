import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCw, X, Check, Minus, Plus, RefreshCw } from "lucide-react";

interface Props {
  file: File;
  /** Starting aspect ratio; the user can change it unless `lockAspect` is set. */
  aspect?: number;
  lockAspect?: boolean;
  title?: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}

const RATIOS: { label: string; value: number }[] = [
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "Wide", value: 3 },
];

/**
 * Forgiving cropper: drag to move, wheel / slider / buttons to zoom (you can
 * zoom out past the frame), rotate freely and switch the crop shape.
 */
export function ImageCropper({
  file,
  aspect = 1,
  lockAspect = false,
  title = "Crop photo",
  onCancel,
  onDone,
}: Props) {
  const [ratio, setRatio] = useState(aspect);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [boxW, setBoxW] = useState(360);

  useEffect(() => {
    const update = () => setBoxW(Math.min(420, Math.max(240, window.innerWidth - 96)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const boxH = Math.round(boxW / ratio);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function reset() {
    setZoom(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  }

  // Base scale = "cover" the frame at zoom 1; the user can then go smaller.
  const swapped = ((rotation % 180) + 180) % 180 !== 0;
  const natW = img ? (swapped ? img.naturalHeight : img.naturalWidth) : 1;
  const natH = img ? (swapped ? img.naturalWidth : img.naturalHeight) : 1;
  const baseScale = Math.max(boxW / natW, boxH / natH);
  const scale = baseScale * zoom;

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    // No clamping — panning is completely free.
    setPos({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) });
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function confirm() {
    if (!img) return;
    const OUT_W = 1400;
    const OUT_H = Math.round(OUT_W / ratio);
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const factor = OUT_W / boxW;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.save();
    ctx.translate(OUT_W / 2 + pos.x * factor, OUT_H / 2 + pos.y * factor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * factor, scale * factor);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82),
    );
    if (!blob) return;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    onDone(new File([blob], name, { type: "image/webp" }));
  }

  if (typeof document === "undefined") return null;

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary-soft";

  return createPortal(
    <div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card-hover">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-black">{title}</h3>
          <button type="button" onClick={onCancel} aria-label="Cancel" className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag to move, scroll or use − / + to zoom. Zoom out to fit the whole photo.
        </p>

        <div
          className="mx-auto mt-4 touch-none overflow-hidden rounded-2xl border-2 border-primary/30 bg-muted"
          style={{ width: boxW, height: boxH, cursor: dragRef.current ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => {
            e.preventDefault();
            setZoom((z) => Math.min(4, Math.max(0.2, z * (e.deltaY > 0 ? 0.94 : 1.06))));
          }}
        >
          {img && (
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={img.src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  marginLeft: -img.naturalWidth / 2,
                  marginTop: -img.naturalHeight / 2,
                  transformOrigin: "center center",
                  transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${scale})`,
                  maxWidth: "none",
                }}
                className="select-none"
              />
            </div>
          )}

        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" aria-label="Zoom out" className={iconBtn} onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}>
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={0.2}
            max={4}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Zoom"
          />
          <button type="button" aria-label="Zoom in" className={iconBtn} onClick={() => setZoom((z) => Math.min(4, z + 0.1))}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" aria-label="Rotate" className={iconBtn} onClick={() => setRotation((r) => r + 90)}>
            <RotateCw className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={((rotation + 180) % 360) - 180}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Rotate finely"
          />
          <button type="button" aria-label="Reset" className={iconBtn} onClick={reset}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {!lockAspect && (
          <div className="mt-3 flex flex-wrap gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRatio(r.value)}
                className={`rounded-full border-2 px-3 py-1 text-[11px] font-black uppercase tracking-wider transition ${
                  Math.abs(ratio - r.value) < 0.01
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-primary/20 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-muted-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!img}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Use photo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
