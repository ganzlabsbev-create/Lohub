import fs from "fs";
import path from "path";

// อ่านค่าตั้งค่าเว็บจาก data/settings/site.json — ใช้ตอน build (getStaticProps) เท่านั้น
// เพราะ fs ใช้ได้แค่ฝั่ง server/build ไม่ใช่ในเบราว์เซอร์
export function getSiteSettings() {
  const filePath = path.join(process.cwd(), "data", "settings", "site.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
