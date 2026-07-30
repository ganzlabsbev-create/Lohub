// Mock Admin — Part 8 ยังไม่มี PR/GitHub Actions จริง (รอ Part 10)
// จำลอง "อนุมัติ" ด้วยการย้าย draft ออกจาก mockdev_submissions แล้วเก็บเป็นแอป "published" แยกไว้ที่นี่
// จำลอง "ปฏิเสธ" ด้วยการย้าย draft ออกไปเก็บพร้อมเหตุผล ให้ฝั่ง Developer เห็นสถานะ rejected ต่อได้ (StatusBadge เตรียมไว้ตั้งแต่ Part 7)

import { getMockSubmissions, removeMockSubmission } from "./mockAuth";

const APPROVED_KEY = "adminmock_approved_apps";
const REJECTED_KEY = "adminmock_rejected";

export function getMockApprovedApps() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(APPROVED_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getMockApprovedApp(appId) {
  return getMockApprovedApps()[appId] || null;
}

export function getMockRejected() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REJECTED_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getMockRejectedFor(developerId) {
  return Object.values(getMockRejected()).filter((r) => r.developer_id === developerId);
}

// อนุมัติ draft ที่รอตรวจ — ในระบบจริง (Part 10) คือย้ายไฟล์ pending/{id}.json → apps/{id}.json ผ่าน PR merge
// แล้วให้ Builder รัน build.js สร้าง search-index.json ใหม่ ตอนนี้ยังเป็น client mock เลยเก็บผลไว้ใน localStorage แทน
export function approveMockSubmission(draft) {
  if (typeof window === "undefined") return null;
  const now = new Date().toISOString();
  const approvedApp = { ...draft, status: "published", updated_at: now };

  const all = getMockApprovedApps();
  all[approvedApp.id] = approvedApp;
  window.localStorage.setItem(APPROVED_KEY, JSON.stringify(all));

  removeMockSubmission(draft.id);
  return approvedApp;
}

// ปฏิเสธ draft ที่รอตรวจ พร้อมเหตุผล — เก็บ draft เดิมไว้ (เผื่ออนาคตอยากทำ "แก้ไขแล้วส่งใหม่")
export function rejectMockSubmission(draft, reason) {
  if (typeof window === "undefined") return null;
  const now = new Date().toISOString();
  const rejectedRecord = {
    ...draft,
    status: "rejected",
    reject_reason: reason.trim(),
    updated_at: now,
  };

  const all = getMockRejected();
  all[rejectedRecord.id] = rejectedRecord;
  window.localStorage.setItem(REJECTED_KEY, JSON.stringify(all));

  removeMockSubmission(draft.id);
  return rejectedRecord;
}

// รวม queue ที่รอตรวจทั้งหมด (ทุก developer) — ใช้ในหน้า admin/queue.js
export function getPendingQueue() {
  return getMockSubmissions();
}

// ---------- Part 9: จัดการหมวดหมู่ ----------
// ของจริง data/categories/{id}.json แก้ตรงๆ ผ่าน PR (Part 10) ฝั่ง client เขียนทับไฟล์จริงไม่ได้
// เลยใช้แพทเทิร์นเดียวกับแอปที่ mock-อนุมัติ: เก็บ "ส่วนต่าง" (override) ของหมวดเดิม + หมวดที่สร้างใหม่แยกคีย์ localStorage
const CATEGORY_OVERRIDES_KEY = "adminmock_category_overrides"; // { [id]: patch } ของหมวดที่มีอยู่จริงใน data/categories/
const CATEGORY_NEW_KEY = "adminmock_new_categories"; // { [id]: category } หมวดที่ admin สร้างใหม่ในเครื่องนี้

function readJsonStore(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function getCategoryOverrides() {
  return readJsonStore(CATEGORY_OVERRIDES_KEY, {});
}

export function getNewCategories() {
  return readJsonStore(CATEGORY_NEW_KEY, {});
}

// แก้ไขหมวดหมู่ — `isNew` บอกว่าเป็นหมวดที่ admin สร้างเอง (แก้ที่ store ใหม่) หรือหมวดจริงจาก data/ (แก้ที่ override)
export function updateMockCategory(id, patch, isNew) {
  if (typeof window === "undefined") return;
  const key = isNew ? CATEGORY_NEW_KEY : CATEGORY_OVERRIDES_KEY;
  const all = readJsonStore(key, {});
  all[id] = { ...all[id], ...patch };
  window.localStorage.setItem(key, JSON.stringify(all));
}

// สร้างหมวดหมู่ใหม่ทั้งก้อน — ในระบบจริงคือสร้างไฟล์ data/categories/{id}.json ใหม่ผ่าน PR
export function addMockCategory(category) {
  if (typeof window === "undefined") return;
  const all = getNewCategories();
  all[category.id] = category;
  window.localStorage.setItem(CATEGORY_NEW_KEY, JSON.stringify(all));
}

// ลบได้เฉพาะหมวดที่ admin สร้างใหม่ในเครื่องนี้เท่านั้น (ยังไม่เคยเป็น PR จริง) — หมวดจากไฟล์จริงต้องลบผ่าน PR ใน Part 10
export function removeMockNewCategory(id) {
  if (typeof window === "undefined") return;
  const all = getNewCategories();
  delete all[id];
  window.localStorage.setItem(CATEGORY_NEW_KEY, JSON.stringify(all));
}

export function nextMockCategoryId(baseCategories) {
  const n = baseCategories.length + Object.keys(getNewCategories()).length + 1;
  return `cat_${String(n).padStart(3, "0")}`;
}

// รวมหมวดจริง (พร้อม override) + หมวดใหม่ที่ admin สร้าง แล้วเรียงตาม order — ใช้แสดงผลหน้า admin/categories.js
export function getEffectiveCategories(baseCategories) {
  const overrides = getCategoryOverrides();
  const merged = baseCategories.map((c) => ({ ...c, ...(overrides[c.id] || {}) }));
  const added = Object.values(getNewCategories()).map((c) => ({ ...c, __isNew: true }));
  return [...merged, ...added].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// ---------- Part 9: จัดการนักพัฒนา (ระงับ/แบน) ----------
// ใช้ field `status` ที่มีอยู่แล้วใน schema data/developers/{id}.json (ค่าเริ่มต้น "active")
// เก็บ override ไว้ในเครื่องนี้ก่อน (Part 10 ค่อยต่อเป็น PR แก้ไฟล์จริง)
const DEV_STATUS_KEY = "adminmock_developer_status"; // { [devId]: "active" | "suspended" }

export function getDeveloperStatusOverrides() {
  return readJsonStore(DEV_STATUS_KEY, {});
}

export function setMockDeveloperStatus(devId, status) {
  if (typeof window === "undefined") return;
  const all = getDeveloperStatusOverrides();
  all[devId] = status;
  window.localStorage.setItem(DEV_STATUS_KEY, JSON.stringify(all));
}

export function getEffectiveDevelopers(baseDevelopers) {
  const overrides = getDeveloperStatusOverrides();
  return baseDevelopers.map((d) => ({ ...d, status: overrides[d.id] || d.status }));
}
