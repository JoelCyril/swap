import { r as __toESM } from "../_runtime.mjs";
import { v as require_react_dom } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { C as Minus, U as Check, g as RotateCw, t as X, v as RefreshCw, y as Plus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ImageCropper-DlevZXe0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var RATIOS = [
	{
		label: "Square",
		value: 1
	},
	{
		label: "4:3",
		value: 4 / 3
	},
	{
		label: "16:9",
		value: 16 / 9
	},
	{
		label: "Wide",
		value: 3
	}
];
/**
* Forgiving cropper: drag to move, wheel / slider / buttons to zoom (you can
* zoom out past the frame), rotate freely and switch the crop shape.
*/
function ImageCropper({ file, aspect = 1, lockAspect = false, title = "Crop photo", onCancel, onDone }) {
	const [ratio, setRatio] = (0, import_react.useState)(aspect);
	const [img, setImg] = (0, import_react.useState)(null);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [rotation, setRotation] = (0, import_react.useState)(0);
	const [pos, setPos] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const dragRef = (0, import_react.useRef)(null);
	const [boxW, setBoxW] = (0, import_react.useState)(360);
	(0, import_react.useEffect)(() => {
		const update = () => setBoxW(Math.min(420, Math.max(240, window.innerWidth - 96)));
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);
	const boxH = Math.round(boxW / ratio);
	(0, import_react.useEffect)(() => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => setImg(image);
		image.src = objectUrl;
		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);
	function reset() {
		setZoom(1);
		setRotation(0);
		setPos({
			x: 0,
			y: 0
		});
	}
	const swapped = (rotation % 180 + 180) % 180 !== 0;
	const natW = img ? swapped ? img.naturalHeight : img.naturalWidth : 1;
	const natH = img ? swapped ? img.naturalWidth : img.naturalHeight : 1;
	const scale = Math.max(boxW / natW, boxH / natH) * zoom;
	function onPointerDown(e) {
		e.target.setPointerCapture(e.pointerId);
		dragRef.current = {
			px: e.clientX,
			py: e.clientY,
			ox: pos.x,
			oy: pos.y
		};
	}
	function onPointerMove(e) {
		const d = dragRef.current;
		if (!d) return;
		setPos({
			x: d.ox + (e.clientX - d.px),
			y: d.oy + (e.clientY - d.py)
		});
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
		ctx.rotate(rotation * Math.PI / 180);
		ctx.scale(scale * factor, scale * factor);
		ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
		ctx.restore();
		const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", .9));
		if (!blob) return;
		const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
		onDone(new File([blob], name, { type: "image/jpeg" }));
	}
	if (typeof document === "undefined") return null;
	const iconBtn = "grid h-9 w-9 place-items-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary-soft";
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card-hover",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-black",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancel,
						"aria-label": "Cancel",
						className: "rounded-full p-1 hover:bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Drag to move, scroll or use − / + to zoom. Zoom out to fit the whole photo."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mt-4 touch-none overflow-hidden rounded-2xl border-2 border-primary/30 bg-muted",
					style: {
						width: boxW,
						height: boxH,
						cursor: dragRef.current ? "grabbing" : "grab"
					},
					onPointerDown,
					onPointerMove,
					onPointerUp,
					onPointerCancel: onPointerUp,
					onWheel: (e) => {
						e.preventDefault();
						setZoom((z) => Math.min(4, Math.max(.2, z * (e.deltaY > 0 ? .94 : 1.06))));
					},
					children: img && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative h-full w-full overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: img.src,
							alt: "",
							draggable: false,
							style: {
								position: "absolute",
								left: "50%",
								top: "50%",
								width: img.naturalWidth,
								height: img.naturalHeight,
								marginLeft: -img.naturalWidth / 2,
								marginTop: -img.naturalHeight / 2,
								transformOrigin: "center center",
								transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${scale})`,
								maxWidth: "none"
							},
							className: "select-none"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Zoom out",
							className: iconBtn,
							onClick: () => setZoom((z) => Math.max(.2, z - .1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: .2,
							max: 4,
							step: .02,
							value: zoom,
							onChange: (e) => setZoom(Number(e.target.value)),
							className: "flex-1 accent-primary",
							"aria-label": "Zoom"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Zoom in",
							className: iconBtn,
							onClick: () => setZoom((z) => Math.min(4, z + .1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Rotate",
							className: iconBtn,
							onClick: () => setRotation((r) => r + 90),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: -180,
							max: 180,
							step: 1,
							value: (rotation + 180) % 360 - 180,
							onChange: (e) => setRotation(Number(e.target.value)),
							className: "flex-1 accent-primary",
							"aria-label": "Rotate finely"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Reset",
							className: iconBtn,
							onClick: reset,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" })
						})
					]
				}),
				!lockAspect && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: RATIOS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setRatio(r.value),
						className: `rounded-full border-2 px-3 py-1 text-[11px] font-black uppercase tracking-wider transition ${Math.abs(ratio - r.value) < .01 ? "border-primary bg-primary-soft text-primary" : "border-primary/20 text-muted-foreground hover:border-primary/50"}`,
						children: r.label
					}, r.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancel,
						className: "flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-muted-foreground",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: confirm,
						disabled: !img,
						className: "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Use photo"]
					})]
				})
			]
		})
	}), document.body);
}
//#endregion
export { ImageCropper as t };
