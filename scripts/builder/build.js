#!/usr/bin/env node
/**
 * Builder script — Mini App Store
 *
 * รวม data/apps/*.json + data/categories/*.json + data/developers/*.json
 * ให้เป็นไฟล์เดียว public/search-index.json (เว็บโหลดจากตรงนี้จุดเดียว)
 * และอัปเดต data/manifest.json ให้ตรงกับจำนวนไฟล์จริง
 *
 * วิธีรัน:
 *   node scripts/builder/build.js            # รันปกติ (พยายามคำนวณ sha256 ของ apk ด้วย)
 *   node scripts/builder/build.js --no-hash   # ข้ามการคำนวณ sha256 (เร็วกว่า, ใช้ตอนไม่มีเน็ต)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data");
const APPS_DIR = path.join(DATA_DIR, "apps");
const CATEGORIES_DIR = path.join(DATA_DIR, "categories");
const DEVELOPERS_DIR = path.join(DATA_DIR, "developers");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const SEARCH_INDEX_PATH = path.join(ROOT, "public", "search-index.json");

const NO_HASH = process.argv.includes("--no-hash");

const REQUIRED_APP_FIELDS = [
  "schema_version", "id", "name", "slug", "developer_id",
  "category_ids", "install_methods", "status",
];

function readJsonDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const full = path.join(dir, f);
      try {
        const data = JSON.parse(fs.readFileSync(full, "utf-8"));
        return { file: f, data };
      } catch (err) {
        throw new Error(`อ่าน/parse JSON ไม่ได้: ${full} (${err.message})`);
      }
    });
}

function validateApp(file, app) {
  const problems = [];
  for (const field of REQUIRED_APP_FIELDS) {
    if (app[field] === undefined) problems.push(`ขาดฟิลด์ "${field}"`);
  }
  const expectedId = file.replace(/\.json$/, "");
  if (app.id && app.id !== expectedId) {
    problems.push(`id ("${app.id}") ไม่ตรงกับชื่อไฟล์ ("${expectedId}")`);
  }
  if (!Array.isArray(app.install_methods) || app.install_methods.length === 0) {
    problems.push(`"install_methods" ต้องเป็น array และมีอย่างน้อย 1 ช่องทาง`);
  }
  return problems;
}

// คำนวณ sha256 ของไฟล์ apk จาก URL — ใช้ fetch ที่มีติดตัว Node 18+
async function sha256OfUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function fillMissingHashes(apps) {
  if (NO_HASH) {
    console.log("⏭  ข้ามการคำนวณ sha256 (--no-hash)");
    return;
  }
  for (const app of apps) {
    for (const v of app.version_history || []) {
      if (v.apk_url && !v.sha256) {
        try {
          v.sha256 = await sha256OfUrl(v.apk_url);
          console.log(`   ✓ sha256 ${app.id} v${v.version}: ${v.sha256.slice(0, 12)}...`);
        } catch (err) {
          console.warn(`   ⚠ คำนวณ sha256 ไม่ได้ (${app.id} v${v.version}): ${err.message} — ปล่อย null ไว้ก่อน`);
        }
      }
    }
  }
}

async function main() {
  console.log("== Mini App Store Builder ==\n");

  const categoryFiles = readJsonDir(CATEGORIES_DIR);
  const developerFiles = readJsonDir(DEVELOPERS_DIR);
  const appFiles = readJsonDir(APPS_DIR);

  const categories = categoryFiles.map((f) => f.data);
  const developers = developerFiles.map((f) => f.data);
  const apps = appFiles.map((f) => f.data);

  // validate
  let hasError = false;
  for (const { file, data } of appFiles) {
    const problems = validateApp(file, data);
    if (problems.length) {
      hasError = true;
      console.error(`✗ ${file}:`);
      problems.forEach((p) => console.error(`   - ${p}`));
    }
  }
  if (hasError) {
    console.error("\nพบปัญหาข้อมูล — หยุด build (แก้ไฟล์ใน data/apps/ ก่อนแล้วรันใหม่)");
    process.exit(1);
  }
  console.log(`✓ ตรวจสอบข้อมูลผ่าน: ${apps.length} apps, ${categories.length} categories, ${developers.length} developers\n`);

  console.log("กำลังคำนวณ sha256 ของไฟล์ apk ที่ยังไม่มี (ถ้ามี)...");
  await fillMissingHashes(apps);

  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const developerById = Object.fromEntries(developers.map((d) => [d.id, d]));

  const enrichedApps = apps
    .filter((app) => app.status === "published")
    .map((app) => {
      const developer = developerById[app.developer_id];
      const categoryNames = (app.category_ids || [])
        .map((id) => categoryById[id]?.name)
        .filter(Boolean);
      return {
        ...app,
        developer_name: developer ? developer.name : null,
        category_names: categoryNames,
      };
    });

  const searchIndex = {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    apps: enrichedApps,
    categories,
    developers,
  };

  fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
  fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(searchIndex, null, 2) + "\n");
  console.log(`\n✓ เขียน ${path.relative(ROOT, SEARCH_INDEX_PATH)} (${enrichedApps.length} apps ที่ status = published)`);

  // อัปเดต data/apps/*.json ทับกลับ ถ้ามีการเติม sha256 ใหม่ (เก็บ source of truth ให้ตรง)
  for (const { file, data } of appFiles) {
    fs.writeFileSync(path.join(APPS_DIR, file), JSON.stringify(data, null, 2) + "\n");
  }

  const oldManifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"))
    : {};
  const manifest = {
    ...oldManifest,
    schema_version: oldManifest.schema_version || "1.0",
    generated_at: searchIndex.generated_at,
    app_count: apps.length,
    category_count: categories.length,
    developer_count: developers.length,
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ เขียน ${path.relative(ROOT, MANIFEST_PATH)} (apps: ${manifest.app_count}, categories: ${manifest.category_count}, developers: ${manifest.developer_count})`);

  console.log("\nBuild เสร็จสมบูรณ์ ✅");
}

main().catch((err) => {
  console.error("\n✗ Build ล้มเหลว:", err.message);
  process.exit(1);
});
