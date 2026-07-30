import { requireActor, isActorAdmin, gasGet, gasPost } from "../../../lib/apiAuth";

// GET  /api/admin/developer-requests                                    -> คำขอทั้งหมด
// POST /api/admin/developer-requests { request_id, status, admin_note }  -> status: "approved" | "rejected"
//
// หมายเหตุ: การ approve จะยกระดับ role ใน sheet "members" เป็น "developer" ให้อัตโนมัติ (ทำใน Apps Script แล้ว)
// แต่ "developer profile" ที่โชว์หน้าเว็บจริง (data/developers/*.json) ยังต้องให้ Admin เพิ่มไฟล์เองใน GitHub
// ตามขั้นตอนเดิมของโปรเจกต์ (core data ยังเป็น JSON ใน repo) — ดู README หัวข้อ "ข้อจำกัดที่ควรรู้"
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    if (req.method === "GET") {
      const requests = await gasGet("admin_developer_requests");
      return res.status(200).json({ requests });
    }

    if (req.method === "POST") {
      const { request_id, status, admin_note } = req.body || {};
      if (!request_id || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "missing request_id or invalid status" });
      }
      const result = await gasPost("admin_developer_request_status", {
        request_id,
        status,
        admin_note,
      });
      return res.status(200).json({ result });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
