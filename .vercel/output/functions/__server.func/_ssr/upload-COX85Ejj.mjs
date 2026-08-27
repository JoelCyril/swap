import { t as supabase } from "./client-DLMi9Pqt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/upload-COX85Ejj.js
var LONG_LIVED_SECONDS = 3600 * 24 * 365 * 20;
async function uploadFileTo(bucket, file) {
	const { data: sess } = await supabase.auth.getSession();
	const uid = sess.session?.user.id;
	if (!uid) throw new Error("Not signed in");
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
	const path = `${uid}/${crypto.randomUUID()}.${ext}`;
	const up = await supabase.storage.from(bucket).upload(path, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type || void 0
	});
	if (up.error) throw up.error;
	const signed = await supabase.storage.from(bucket).createSignedUrl(path, LONG_LIVED_SECONDS);
	if (signed.error || !signed.data) throw signed.error ?? /* @__PURE__ */ new Error("Failed to sign URL");
	return signed.data.signedUrl;
}
//#endregion
export { uploadFileTo as t };
