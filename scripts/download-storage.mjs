import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://ramwgcdselnqtcadkaok.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbXdnY2RzZWxucXRjYWRrYW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk0NzA0NiwiZXhwIjoyMTA0NTIzMDQ2fQ.aauNRjxQ4_KREKoi7pPSgSqTxG5mDIlfxQji6j3EgZ0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BACKUP_DIR = path.resolve("./supabase_storage_backup");

async function listAllFiles(bucket, folder = "") {
  let files = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Error listing ${bucket}/${folder}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      // If item has no id, or metadata is null, it's a folder/prefix
      if (!item.id && !item.metadata) {
        const subFiles = await listAllFiles(bucket, fullPath);
        files.push(...subFiles);
      } else {
        files.push({ bucket, path: fullPath, size: item.metadata?.size || 0 });
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function downloadFile(bucket, filePath) {
  const localTarget = path.join(BACKUP_DIR, bucket, filePath);
  const targetDir = path.dirname(localTarget);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    console.error(`  ❌ Failed to download ${bucket}/${filePath}:`, error.message);
    return 0;
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(localTarget, buffer);
  return buffer.length;
}

async function run() {
  console.log("=========================================");
  console.log("🚀 Starting Supabase Storage Local Backup");
  console.log("Target directory:", BACKUP_DIR);
  console.log("=========================================\n");

  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error("Failed to list buckets:", bucketsErr);
    process.exit(1);
  }

  console.log(`Found ${buckets.length} storage bucket(s):`, buckets.map((b) => b.name).join(", "));

  let totalFilesCount = 0;
  let totalBytes = 0;

  for (const bucket of buckets) {
    console.log(`\n📂 Scanning bucket: [${bucket.name}]...`);
    const files = await listAllFiles(bucket.name);
    console.log(`   Found ${files.length} file(s) in [${bucket.name}]. Downloading...`);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const downloadedBytes = await downloadFile(f.bucket, f.path);
      totalBytes += downloadedBytes;
      totalFilesCount++;
      const sizeKb = (downloadedBytes / 1024).toFixed(1);
      console.log(`   [${i + 1}/${files.length}] Downloaded: ${f.path} (${sizeKb} KB)`);
    }
  }

  console.log("\n=========================================");
  console.log("✅ Backup completed successfully!");
  console.log(`Total files downloaded: ${totalFilesCount}`);
  console.log(`Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Saved locally to: ${BACKUP_DIR}`);
  console.log("=========================================");
}

run().catch((err) => {
  console.error("Fatal error during backup:", err);
  process.exit(1);
});
