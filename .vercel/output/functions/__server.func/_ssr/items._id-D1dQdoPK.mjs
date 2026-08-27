import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/items._id-D1dQdoPK.js
var $$splitComponentImporter = () => import("./items._id-YMFsGMuT.mjs");
var Route = createFileRoute("/items/$id")({
	head: () => ({ meta: [
		{ title: "Inventory item — SWAP" },
		{
			name: "description",
			content: "Details of an item in a SWAP member's inventory."
		},
		{
			property: "og:title",
			content: "Inventory item — SWAP"
		},
		{
			property: "og:description",
			content: "Details of an item in a SWAP member's inventory."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
