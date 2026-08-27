import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings.index--djcYRW4.js
var $$splitComponentImporter = () => import("./listings.index-BrwEFH-Y.mjs");
var Route = createFileRoute("/listings/")({
	validateSearch: (search) => ({ q: typeof search.q === "string" && search.q.length > 0 ? search.q.slice(0, 80) : void 0 }),
	head: () => ({ meta: [
		{ title: "SWAP │ Trade Items Easily" },
		{
			name: "description",
			content: "Browse items UAE neighbours want to trade. Filter by category, emirate and area."
		},
		{
			property: "og:title",
			content: "Browse listings — SWAP"
		},
		{
			property: "og:description",
			content: "Find items to swap in your emirate and area."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
