// Helper เรียก GitHub Contents API ตรงๆ ด้วย GITHUB_ADMIN_TOKEN (สิทธิ์ "repo" เต็ม) — ใช้เฉพาะ
// endpoint ฝั่งแอดมินที่ต้องอ่าน/เขียน/ลบไฟล์ตรงเข้า main โดยไม่ผ่าน PR (คนละแบบกับ lib/githubCommit.js
// ที่ใช้ GITHUB_COMMIT_TOKEN เปิด PR เท่านั้น — ดูคอมเมนต์ในไฟล์นั้นเรื่องทำไมต้องแยกกัน)
//
// ใช้ร่วมกันระหว่าง:
//   - pages/api/admin/apps/[id].js       (DELETE ลบแอป / PATCH อนุมัติ-ปฏิเสธแอปที่รอตรวจ)
//   - pages/api/admin/apps/pending.js    (GET รายชื่อแอปที่ status = "pending")
//
// ต้องตั้งค่า Environment Variables (ดู README):
//   GITHUB_ADMIN_TOKEN, GITHUB_REPO (เช่น "your-username/Lohub"), GITHUB_BRANCH (ค่าเริ่มต้น "main")

const GITHUB_API = "https://api.github.com";

export function assertAdminConfigured() {
  if (!process.env.GITHUB_ADMIN_TOKEN || !process.env.GITHUB_REPO) {
    throw new Error("ยังไม่ได้ตั้งค่า GITHUB_ADMIN_TOKEN / GITHUB_REPO ใน Environment Variables");
  }
}

export function adminRepo() {
  return process.env.GITHUB_REPO;
}

export function adminBranch() {
  return process.env.GITHUB_BRANCH || "main";
}

export async function githubAdminRequest(path, options = {}) {
  assertAdminConfigured();
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ADMIN_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `GitHub API error (${res.status}) ที่ ${path}`);
  return data;
}

// รายชื่อไฟล์ .json ทั้งหมดในโฟลเดอร์ (เช่น "data/apps") — คืน [] ถ้าโฟลเดอร์ยังไม่มีอยู่จริง
export async function listRepoJsonDir(dirPath) {
  try {
    const items = await githubAdminRequest(
      `/repos/${adminRepo()}/contents/${dirPath}?ref=${adminBranch()}`
    );
    return (Array.isArray(items) ? items : []).filter((f) => f.name.endsWith(".json"));
  } catch {
    return [];
  }
}

// อ่านไฟล์ JSON เดียวพร้อม sha ปัจจุบัน (ต้องใช้ sha ตอน PUT ทับไฟล์เดิม ตามข้อกำหนดของ GitHub API)
export async function getRepoJsonFile(filePath) {
  const info = await githubAdminRequest(
    `/repos/${adminRepo()}/contents/${filePath}?ref=${adminBranch()}`
  );
  const json = JSON.parse(Buffer.from(info.content, "base64").toString("utf-8"));
  return { json, sha: info.sha };
}

// เขียนทับไฟล์ JSON เดิม (ต้องมี sha อยู่แล้ว — ใช้กรณี update เท่านั้น ไม่ใช่สร้างไฟล์ใหม่)
export async function putRepoJsonFile(filePath, json, sha, message) {
  const content = Buffer.from(JSON.stringify(json, null, 2) + "\n").toString("base64");
  return githubAdminRequest(`/repos/${adminRepo()}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content, sha, branch: adminBranch() }),
  });
}
