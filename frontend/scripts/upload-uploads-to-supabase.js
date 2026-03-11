import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_DEFAULT_KEY
  || ""
).trim();
const BUCKET = ((process.env.SUPABASE_UPLOADS_BUCKET || "uploads") || "uploads").trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or service role key");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ensureBucket(bucket) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existing = (data || []).map((b) => b.name).filter(Boolean);
  if (existing.includes(bucket)) return;
  const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
  if (createError) throw createError;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { start: 0, count: 0, concurrency: 6 };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    const next = args[i + 1];
    if (a === "--start" && next) out.start = Number(next) || 0;
    if (a === "--count" && next) out.count = Number(next) || 0;
    if (a === "--concurrency" && next) out.concurrency = Math.max(1, Number(next) || 6);
  }
  return out;
}

async function listUploads(dir) {
  const entries = await fs.readdir(dir);
  return entries
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "en"));
}

async function uploadOne(dir, fileName) {
  const localPath = path.join(dir, fileName);
  const bytes = await fs.readFile(localPath);
  const key = `telegram/${fileName}`;
  const contentType = fileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : fileName.toLowerCase().endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  const { error } = await supabase.storage.from(BUCKET).upload(key, bytes, {
    contentType,
    upsert: false
  });
  if (!error) return { ok: true, key };
  const msg = String(error.message || "");
  if (/already exists/i.test(msg) || /Duplicate/i.test(msg) || /The resource already exists/i.test(msg)) {
    return { ok: true, key };
  }
  return { ok: false, key, error: msg };
}

async function runPool(items, concurrency, handler) {
  let idx = 0;
  const results = { ok: 0, fail: 0 };
  const workers = Array.from({ length: concurrency }).map(async () => {
    while (true) {
      const current = idx;
      idx += 1;
      if (current >= items.length) break;
      const item = items[current];
      const res = await handler(item);
      if (res.ok) results.ok += 1;
      else results.fail += 1;
      if ((results.ok + results.fail) % 200 === 0) {
        process.stdout.write(`Uploaded: ${results.ok}, failed: ${results.fail}\n`);
      }
      if (!res.ok) {
        process.stdout.write(`Failed: ${res.key} ${res.error}\n`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const { start, count, concurrency } = parseArgs();
  const uploadsDir = path.join(__dirname, "../public/uploads");
  await ensureBucket(BUCKET);
  const all = await listUploads(uploadsDir);
  const slice = count > 0 ? all.slice(start, start + count) : all.slice(start);
  process.stdout.write(`Files: ${slice.length} (start=${start}, count=${count || "all"}, concurrency=${concurrency})\n`);
  const results = await runPool(slice, concurrency, async (fileName) => uploadOne(uploadsDir, fileName));
  process.stdout.write(`Done. Uploaded: ${results.ok}, failed: ${results.fail}\n`);
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});

