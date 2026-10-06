import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://ramwgcdselnqtcadkaok.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbXdnY2RzZWxucXRjYWRrYW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk0NzA0NiwiZXhwIjoyMTA0NTIzMDQ2fQ.aauNRjxQ4_KREKoi7pPSgSqTxG5mDIlfxQji6j3EgZ0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DB_BACKUP_DIR = path.resolve("./supabase_db_backup");

const ALL_TABLES = [
  "profiles",
  "items",
  "listings",
  "offers",
  "messages",
  "meetup_proposals",
  "favourites",
  "user_follows",
  "flags",
  "announcements",
  "notifications",
  "notification_prefs",
  "profile_private",
  "support_inquiries",
  "user_bans",
  "user_blocks",
  "user_roles",
  "referrals",
];

async function run() {
  console.log("=========================================");
  console.log("🚀 Starting Full Supabase Database Backup");
  console.log("=========================================\n");

  if (!fs.existsSync(DB_BACKUP_DIR)) {
    fs.mkdirSync(DB_BACKUP_DIR, { recursive: true });
  }

  for (const table of ALL_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.warn(`  ⚠️ Table [${table}]: ${error.message}`);
        continue;
      }
      const filePath = path.join(DB_BACKUP_DIR, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`  ✅ [${table}]: Saved ${data.length} records`);
    } catch (e) {
      console.warn(`  ❌ Failed to backup [${table}]:`, e.message);
    }
  }

  console.log("\n=========================================");
  console.log("✅ Complete database backup finished!");
  console.log(`Saved locally to: ${DB_BACKUP_DIR}`);
  console.log("=========================================");
}

run();
