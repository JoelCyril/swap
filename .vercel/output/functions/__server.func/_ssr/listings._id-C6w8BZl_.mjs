import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings._id-C6w8BZl_.js
var $$splitComponentImporter = () => import("./listings._id-BQKMvVs-.mjs");
var Route = createFileRoute("/listings/$id")({
	ssr: false,
	head: ({ params }) => ({ meta: [
		{ title: `Listing on SWAP` },
		{
			name: "description",
			content: `View a listing and make an offer on SWAP.`
		},
		{
			property: "og:title",
			content: "SWAP listing"
		},
		{
			property: "og:description",
			content: `Listing ${params.id} on SWAP.`
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
