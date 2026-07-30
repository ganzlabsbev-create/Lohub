import { requireActor, isActorAdmin } from "../../../../lib/apiAuth";

// DELETE /api/admin/apps/app_0007
//
// อธิบาย: apps/categories/developers ในโปรเจกต์นี้ยังเป็นไฟล์ JSON ใน GitHub (ไม่ใช่ Google Sheets)
// ฟีเจอร์ "ลบเฉพาะแอปของแอดมิน" จึงไม่ได้ต่อกับ Apps Script แต่เรียก GitHub Contents API โดยตรง
// เพื่อลบไฟล์ data/apps/{id}.json และตัด entry ออกจาก data/manifest.json แล้ว commit เข้า repo ทันที
//
// ต้องตั้งค่า Environment Variables เพิ่ม (ดู README):
//   GITHUB_ADMIN_TOKEN  — Personal Access Token สิทธิ์ "repo" ของบัญชี admin
//   GITHUB_REPO         — เช่น "your-username/Lohub"
//   GITHUB_BRANCH       — เช่น "main" (ค่าเริ่มต้นถ้าไม่ตั้ง จะใช้ "main")
const GITHUB_API = "https://api.github.com";

async function githubRequest(path, options = {}) {
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
  if (!res.ok) throw new Error(data.message || `GitHub API error (${res.status})`);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "missing app id" });

    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    if (!repo || !process.env.GITHUB_ADMIN_TOKEN) {
      return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GITHUB_ADMIN_TOKEN / GITHUB_REPO" });
    }

    // 1) ลบไฟล์ data/apps/{id}.json — ต้องขอ sha ปัจจุบันของไฟล์ก่อนตามข้อกำหนดของ GitHub API
    const filePath = `data/apps/${id}.json`;
    const fileInfo = await githubRequest(
      `/repos/${repo}/contents/${filePath}?ref=${branch}`
    );
    await githubRequest(`/repos/${repo}/contents/${filePath}`, {
      method: "DELETE",
      body: JSON.stringify({
        message: `admin: ลบแอป ${id}`,
        sha: fileInfo.sha,
        branch,
      }),
    });

    // 2) อัปเดต public/search-index.json — ไฟล์นี้คือสิ่งที่หน้าเว็บโหลดจริงตอน runtime
    //    (ปกติสร้างจาก scripts/builder/build.js แต่ตอนลบแอปเดี่ยวๆ แก้ตรงๆ ในนี้เร็วกว่า
    //    ไม่ต้อง rebuild ทั้งชุด — ตัด entry ของแอปนี้ออกจาก array "apps")
    const indexPath = "public/search-index.json";
    const indexInfo = await githubRequest(
      `/repos/${repo}/contents/${indexPath}?ref=${branch}`
    );
    const searchIndex = JSON.parse(
      Buffer.from(indexInfo.content, "base64").toString("utf-8")
    );
    if (Array.isArray(searchIndex.apps)) {
      searchIndex.apps = searchIndex.apps.filter((app) => app.id !== id);
    }
    const updatedIndex = Buffer.from(
      JSON.stringify(searchIndex, null, 2) + "\n"
    ).toString("base64");
    await githubRequest(`/repos/${repo}/contents/${indexPath}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `admin: ตัด ${id} ออกจาก search-index หลังลบแอป`,
        content: updatedIndex,
        sha: indexInfo.sha,
        branch,
      }),
    });

    // หมายเหตุ: data/manifest.json (app_count ฯลฯ) จะเพี้ยนเล็กน้อยจนกว่าจะรัน
    // `node scripts/builder/build.js` แบบเต็มอีกครั้ง — ไม่กระทบการแสดงผลหน้าเว็บ ข้ามได้

    return res.status(200).json({ deleted: id });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
