import { requireActor, isActorAdmin } from "../../../../lib/apiAuth";
import { assertAdminConfigured, listRepoJsonDir, getRepoJsonFile } from "../../../../lib/githubAdmin";

// GET /api/admin/apps/pending
//
// คืนรายชื่อแอปทั้งหมดใน data/apps/ ที่ status === "pending" — คือแอปที่ผ่านการ merge PR จาก
// scripts/builder/convert-submissions.js แล้ว (ไฟล์ data/apps/{app_id}.json ถูกสร้างจริงแล้ว)
// แต่ยังไม่ถูก publish ขึ้นเว็บ (build.js กรองเอาเฉพาะ status === "published" เข้า search-index.json)
//
// อ่านสดจาก GitHub Contents API เสมอ ไม่ใช้ public/search-index.json เพราะไฟล์นั้นไม่มีแอป pending อยู่แล้ว
// (นี่คือจุดที่หน้า /admin/queue เดิมขาดไป — เดิมอ่านจาก lib/mockAdmin.js ซึ่งเป็น localStorage mock
// คนละระบบกับ data/apps/ จริง เลยไม่เคยเห็นแอปที่ merge เข้ามาจริงๆ)
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    assertAdminConfigured();

    const files = await listRepoJsonDir("data/apps");
    const apps = [];
    for (const f of files) {
      const { json } = await getRepoJsonFile(`data/apps/${f.name}`);
      if (json.status === "pending") apps.push(json);
    }
    apps.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    return res.status(200).json({ apps });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
