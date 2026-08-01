// อ่านไฟล์ JSON จาก data/** ฝั่ง server — ใช้ได้ทั้งใน getStaticProps และ pages/api/**
// (lib/site.js เดิมมี getSiteSettings อยู่แล้ว ไฟล์นี้เพิ่มแค่ getAllDevelopers ให้ API route ใช้)
import fs from "fs";
import path from "path";

export function getAllDevelopers() {
  const dir = path.join(process.cwd(), "data", "developers");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
}

// อ่านแอปเดียวจาก data/apps/{id}.json — ใช้เช็คความเป็นเจ้าของแอป (developer_id) ฝั่ง server
// เท่านั้น (เช่น guard ของ /api/dev/apps/[id]/reports/**) ไม่ใช่แหล่งข้อมูลหลักของหน้าเว็บสาธารณะ
// ซึ่งยังคงใช้ public/search-index.json ผ่าน useSearchIndex เหมือนเดิมทุกที่ — คืน null ถ้าไม่พบไฟล์
export function getAppById(id) {
  if (!id) return null;
  try {
    const filePath = path.join(process.cwd(), "data", "apps", `${id}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// อ่านแอปทั้งหมดจาก data/apps/*.json ฝั่ง server — ใช้เพื่อคำนวณว่า developer คนหนึ่งเป็นเจ้าของ
// app_id ไหนบ้าง (Google Sheet ไม่มีข้อมูล developer_id ผูกกับแอป ข้อมูลนี้อยู่ที่นี่เท่านั้น)
// จำเป็นสำหรับ /api/dev/notifications ที่ต้องส่ง app_ids ไปกรองที่ GAS แทนการส่งแค่ username
export function getAllApps() {
  const dir = path.join(process.cwd(), "data", "apps");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
}
