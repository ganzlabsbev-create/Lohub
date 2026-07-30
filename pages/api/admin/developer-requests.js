import { requireActor, isActorAdmin, gasGet, gasPost } from "../../../lib/apiAuth";
import { createDeveloperProfilePR } from "../../../lib/githubCommit";

// GET  /api/admin/developer-requests                                    -> คำขอทั้งหมด
// POST /api/admin/developer-requests { request_id, status, admin_note, username, reason,
//                                       portfolio_url, display_name, website, contact }
//      -> status: "approved" | "rejected"
//
// หมายเหตุ: การ approve จะยกระดับ role ใน sheet "members" เป็น "developer" ให้อัตโนมัติ (ทำใน Apps Script แล้ว)
// ต่อจากนั้นจะเรียก GitHub API เปิด Pull Request สร้างไฟล์ data/developers/{id}.json ให้อัตโนมัติด้วย
// (ไม่ commit เข้า main ตรงๆ — ให้แอดมินกด merge PR เองอีกทีเป็นจุดตรวจสอบสุดท้าย ดู PLAN-auto-developer-approve.md)
// ถ้าขั้นตอน GAS สำเร็จแต่ GitHub ล้มเหลว จะยังตอบ 200 กลับไปพร้อม github.ok = false + error
// เพื่อให้แอดมินรู้ว่า role เปลี่ยนแล้วแต่ยังไม่มีไฟล์ ต้องลองกด "อนุมัติ" ซ้ำ หรือสร้างไฟล์เองแทน
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    if (req.method === "GET") {
      const requests = await gasGet("admin_developer_requests");
      return res.status(200).json({ requests });
    }

    if (req.method === "POST") {
      const {
        request_id,
        status,
        admin_note,
        username,
        reason,
        portfolio_url,
        display_name,
        website,
        contact,
      } = req.body || {};
      if (!request_id || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "missing request_id or invalid status" });
      }
      const result = await gasPost("admin_developer_request_status", {
        request_id,
        status,
        admin_note,
      });

      let github = null;
      if (status === "approved" && username) {
        try {
          const pr = await createDeveloperProfilePR({
            username,
            reason,
            portfolio_url,
            display_name,
            website,
            contact,
          });
          github = { ok: true, ...pr };
        } catch (err) {
          github = { ok: false, error: String(err) };
        }
      }

      return res.status(200).json({ result, github });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
