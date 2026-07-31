#!/usr/bin/env node
/**
 * Convert-submissions script — Part 10 (ระบบส่งแอปใหม่แบบ PR)
 *
 * รันตอนหลัง PR ที่ developer ส่งแอปใหม่ถูก merge เข้า main แล้ว (มีไฟล์ submissions/{slug}/** ค้างอยู่)
 * หน้าที่:
 *   1. หา submissions/*\/app.json ทั้งหมด
 *   2. กำหนด app_id จริงแบบกันชนกัน (อ่าน data/apps/ ที่มีอยู่ตอนนี้ + เดินหน้าเรื่อยๆ ทีละแอป
 *      ในรันเดียวกัน — ตัว workflow ที่เรียกสคริปต์นี้ต้องมี concurrency group กันรันซ้อนกันสองรันพร้อมกัน
 *      ดู .github/workflows/convert-submissions.yml)
 *   3. ย้าย icon.png -> public/assets/icons/{app_id}.png
 *   4. ย้าย screenshots/*.png -> public/assets/screenshots/{app_id}-01.png, -02.png, ... (เรียงตามชื่อไฟล์)
 *   5. เขียน data/apps/{app_id}.json (status ตามที่ submissions ส่งมา คือ "pending" — รอ Admin กด publish
 *      จริงถ้าระบบมีขั้นตอนอนุมัติซ้อนอีกชั้น ดูหมายเหตุด้านล่าง)
 *   6. ลบโฟลเดอร์ submissions/{slug}/ ทิ้ง
 *
 * หมายเหตุเรื่อง status: ตรวจ pages/admin/queue.js แล้ว — คิวตรวจสอบแอปที่หน้านั้นใช้ lib/mockAdmin.js
 * (localStorage mock เดิม แยกออกจาก flow ส่งแอปจริงนี้คนละระบบ) ในระบบ PR จริง "จุดตรวจสอบ" คือ Admin
 * รีวิว diff ของ PR บน GitHub เองแล้วกด merge — เท่ากับอนุมัติแล้วในตัว จึงเขียน status: "pending" ต่อไป
 * (ตรง schema เดิมของ buildAppDraft) แล้วให้ Admin ไปกดเปลี่ยนเป็น "published" เองทีหลังผ่านการแก้ไฟล์
 * data/apps/{app_id}.json ตรงๆ (ยังไม่มี UI สำหรับขั้นตอนนี้ในสโคปงานนี้ — build.js กรองเอาเฉพาะ
 * status === "published" เข้า search-index.json อยู่แล้ว จึงไม่มีแอป pending หลุดขึ้นเว็บโดยไม่ได้ตั้งใจ)
 *
 * วิธีรัน: node scripts/builder/convert-submissions.js   (รันจาก root ของ repo, ก่อน build.js เสมอ)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SUBMISSIONS_DIR = path.join(ROOT, "submissions");
const APPS_DIR = path.join(ROOT, "data", "apps");
const ICONS_DIR = path.join(ROOT, "public", "assets", "icons"); // ตรงกับโฟลเดอร์จริงที่มีอยู่แล้ว (มี s)
const SCREENSHOTS_DIR = path.join(ROOT, "public", "assets", "screenshots");

function readExistingAppIds() {
  if (!fs.existsSync(APPS_DIR)) return [];
  return fs
    .readdirSync(APPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

// นับต่อจาก id สูงสุดที่มีอยู่จริง (ไม่ใช่แค่จำนวนไฟล์) กันกรณีมีการลบไฟล์ตรงกลางไปแล้วทำให้นับซ้ำ
function makeAppIdCounter() {
  const existingIds = readExistingAppIds();
  let maxN = 0;
  for (const id of existingIds) {
    const m = /^app_(\d+)$/.exec(id);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  return () => {
    maxN += 1;
    return `app_${String(maxN).padStart(4, "0")}`;
  };
}

function listSubmissionSlugs() {
  if (!fs.existsSync(SUBMISSIONS_DIR)) return [];
  return fs
    .readdirSync(SUBMISSIONS_DIR)
    .filter((name) => fs.statSync(path.join(SUBMISSIONS_DIR, name)).isDirectory());
}

function convertOne(slug, nextAppId) {
  const dir = path.join(SUBMISSIONS_DIR, slug);
  const appJsonPath = path.join(dir, "app.json");
  if (!fs.existsSync(appJsonPath)) {
    console.warn(`   ⚠ ข้าม "${slug}" — ไม่มี app.json`);
    return null;
  }

  const draft = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
  const appId = nextAppId();

  // ย้ายไอคอน (บังคับต้องมี ตามสเปกโครงสร้างไฟล์)
  const iconSrc = path.join(dir, "icon.png");
  if (!fs.existsSync(iconSrc)) {
    console.warn(`   ⚠ ข้าม "${slug}" — ไม่มี icon.png`);
    return null;
  }
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  fs.copyFileSync(iconSrc, path.join(ICONS_DIR, `${appId}.png`));

  // ย้ายภาพหน้าจอ (ไม่บังคับ) — เรียงตามชื่อไฟล์ให้ผลลัพธ์ deterministic
  const screenshotsSrcDir = path.join(dir, "screenshots");
  const screenshots = [];
  if (fs.existsSync(screenshotsSrcDir)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    const files = fs
      .readdirSync(screenshotsSrcDir)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b));
    files.forEach((file, i) => {
      const destName = `${appId}-${String(i + 1).padStart(2, "0")}.png`;
      fs.copyFileSync(path.join(screenshotsSrcDir, file), path.join(SCREENSHOTS_DIR, destName));
      screenshots.push(`/assets/screenshots/${destName}`);
    });
  }

  const finalApp = {
    ...draft,
    id: appId,
    icon: { type: "local", path: `/assets/icons/${appId}.png` },
    screenshots,
  };

  fs.mkdirSync(APPS_DIR, { recursive: true });
  fs.writeFileSync(path.join(APPS_DIR, `${appId}.json`), JSON.stringify(finalApp, null, 2) + "\n");

  fs.rmSync(dir, { recursive: true, force: true });

  return { slug, appId, name: finalApp.name };
}

function main() {
  console.log("== Convert submissions -> data/apps ==\n");

  const slugs = listSubmissionSlugs();
  if (slugs.length === 0) {
    console.log("ไม่มี submissions/ ค้างอยู่ ข้ามขั้นตอนนี้\n");
    return;
  }

  const nextAppId = makeAppIdCounter();
  const results = [];
  for (const slug of slugs) {
    const result = convertOne(slug, nextAppId);
    if (result) {
      results.push(result);
      console.log(`   ✓ ${slug} -> ${result.appId} (${result.name})`);
    }
  }

  console.log(`\n✓ แปลงสำเร็จ ${results.length}/${slugs.length} แอป\n`);
}

main();
