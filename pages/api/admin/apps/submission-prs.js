import { requireActor, isActorAdmin } from "../../../../lib/apiAuth";
import { assertAdminConfigured, listOpenSubmissionPRs } from "../../../../lib/githubAdmin";

// GET /api/admin/apps/submission-prs
//
// รายชื่อ PR ส่งแอปใหม่ที่ยังเปิดค้างอยู่ (ยังไม่ merge) — คนละสถานะกับ data/apps/{id}.json ที่
// status = "pending" (นั่นคือ PR ที่ merge ไปแล้วแต่ยังไม่ publish) ลำดับขั้นตอนเต็ม:
//   ส่งแอปใหม่ -> เปิด PR (รายการในหน้านี้) -> [กด merge] -> convert-submissions.yml สร้าง
//   data/apps/{id}.json (status: pending) -> [กด อนุมัติ ในคิวด้านล่าง] -> published ขึ้นเว็บ
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    assertAdminConfigured();

    const prs = await listOpenSubmissionPRs();
    return res.status(200).json({
      prs: prs.map((pr) => ({
        number: pr.number,
        title: pr.title,
        html_url: pr.html_url,
        author: pr.user?.login,
        created_at: pr.created_at,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
