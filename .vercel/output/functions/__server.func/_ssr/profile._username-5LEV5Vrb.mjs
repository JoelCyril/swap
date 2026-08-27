import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile._username-5LEV5Vrb.js
var $$splitComponentImporter = () => import("./profile._username-CamX4tKu.mjs");
var Route = createFileRoute("/profile/$username")({
	head: ({ params }) => ({ meta: [
		{ title: `@${params.username} — SWAP` },
		{
			name: "description",
			content: `View @${params.username}'s public inventory and active listings on SWAP.`
		},
		{
			property: "og:title",
			content: `@${params.username} on SWAP`
		},
		{
			property: "og:description",
			content: `Public inventory and listings for @${params.username}.`
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
