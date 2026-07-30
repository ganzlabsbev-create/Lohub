// เดิมไฟล์นี้มีระบบ mock login ด้วย (getCurrentDeveloperId/setCurrentDeveloperId/logoutMockDeveloper)
// Part 10 แทนที่ด้วย GitHub OAuth จริง (next-auth + lib/auth.js) แล้ว จึงลบส่วนนั้นออก
// ส่วนที่เหลือด้านล่างนี้ยังเป็น "mock" อยู่ (localStorage) เพราะฝั่ง client ยังสร้าง PR จริงไม่ได้
// (รอฟีเจอร์ "ระบบส่งแอปอัตโนมัติเต็มรูปแบบ" ในหัวข้อแนวทางระยะยาวของสเปก)

const SUBMISSIONS_KEY = "mockdev_submissions";

// เก็บ draft ที่ "ส่งแล้ว" ไว้ในเครื่อง (จำลอง data/pending/*.json)
// Part 7 (Dashboard) จะมาอ่านค่านี้ต่อเพื่อโชว์สถานะ "รอตรวจ"
export function getMockSubmissions() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SUBMISSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addMockSubmission(draft) {
  const list = getMockSubmissions();
  list.unshift(draft);
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  return list;
}

// แก้ไข draft ที่ยัง "รอตรวจ" อยู่ (ยังไม่ผ่าน admin) — ใช้ตอนกดแก้ไขจาก Dashboard (Part 7)
export function updateMockSubmission(id, updatedDraft) {
  if (typeof window === "undefined") return [];
  const list = getMockSubmissions().map((d) => (d.id === id ? updatedDraft : d));
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  return list;
}

// เอา draft ออกจากคิวรอตรวจ — ใช้ตอน admin อนุมัติ/ปฏิเสธ (Part 8)
export function removeMockSubmission(id) {
  if (typeof window === "undefined") return [];
  const list = getMockSubmissions().filter((d) => d.id !== id);
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  return list;
}

// เก็บ "อัปเดตเวอร์ชันใหม่" ของแอปที่ผ่านการอนุมัติแล้ว (data/apps/*.json)
// เพราะฝั่ง client เขียนไฟล์จริงไม่ได้ — จำลองไว้ก่อน รอ Part 10 ต่อเป็น PR จริง
const APP_UPDATES_KEY = "mockdev_app_updates";

export function getMockAppUpdates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(APP_UPDATES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getMockAppUpdate(appId) {
  return getMockAppUpdates()[appId] || null;
}

export function setMockAppUpdate(appId, updatedApp) {
  if (typeof window === "undefined") return {};
  const all = getMockAppUpdates();
  all[appId] = updatedApp;
  window.localStorage.setItem(APP_UPDATES_KEY, JSON.stringify(all));
  return all;
}
