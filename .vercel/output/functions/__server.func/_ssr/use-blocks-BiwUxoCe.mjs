import { n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn } from "./db-types-Dz-qEZef.mjs";
import { o as useSession } from "./flags2.functions-CKoPdqok.mjs";
import { r as listBlockedIds } from "./settings.functions-CRzd-yIT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-blocks-BiwUxoCe.js
/** Ids of members hidden from the current viewer (blocked either direction). */
function useBlockedIds() {
	const { session } = useSession();
	const fn = useServerFn(listBlockedIds);
	const { data } = useQuery({
		queryKey: ["blocked-ids"],
		queryFn: () => fn(),
		enabled: !!session,
		staleTime: 6e4
	});
	return new Set(data ?? []);
}
//#endregion
export { useBlockedIds as t };
