// อ่านไฟล์ JSON จาก data/** ฝั่ง server — ใช้ได้ทั้งใน getStaticProps และ pages/api/**
// (lib/site.js เดิมมี getSiteSettings อยู่แล้ว ไฟล์นี้เพิ่มแค่ getAllDevelopers ให้ API route ใช้)
import fs from "fs";
import path from "path";

export function getAllDevelopers() {
  const dir = path.join(process.cwd(), "data", "developers");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
}
