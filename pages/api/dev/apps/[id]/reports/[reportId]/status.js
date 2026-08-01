import { requireAppOwner, gasPost } from "../../../../../../../lib/apiAuth";

const ALLOWED_STATUSES = ["open", "replied", "resolved", "closed"];

// POST /api/dev/apps/app_0001/reports/rp_xxx/status  { status }
// -> developer เจ้าของแอปเปลี่ยนสถานะรายงานได้ทุกสถานะ — admin ห้ามเรียก endpoint นี้เด็ดขาด
//    (ตาม permission model: admin เห็นได้อย่างเดียว requireAppOwner ก็ปฏิเสธ admin อยู่แล้ว
//    เพราะเช็คจาก developer_id ไม่ใช่ role admin)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const { id, reportId } = req.query;
    const guard = await requireAppOwner(req, res, id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    const { status } = req.body || {};
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status ต้องเป็นหนึ่งใน ${ALLOWED_STATUSES.join(", ")}` });
    }

    // GAS action: update_report_status(report_id, status)
    const result = await gasPost("update_report_status", { report_id: reportId, status });
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
