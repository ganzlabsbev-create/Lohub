import { requireAppOwner, gasPost } from "../../../../../../../lib/apiAuth";

// POST /api/dev/apps/app_0001/reports/rp_xxx/reply  { message }
// -> developer เจ้าของแอปตอบกลับรายงาน — ตอบครั้งแรกเปลี่ยนสถานะเป็น "replied" อัตโนมัติ
//    (ฝั่ง GAS action add_report_reply เป็นคนเช็ค: ถ้า status ปัจจุบัน === "open" ให้เซ็ตเป็น "replied" เอง)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const { id, reportId } = req.query;
    const guard = await requireAppOwner(req, res, id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    const { message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: "missing message" });

    // GAS action: add_report_reply(report_id, author_username, author_role, message)
    const reply = await gasPost("add_report_reply", {
      report_id: reportId,
      author_username: guard.actor.username,
      author_role: "developer",
      message: message.trim(),
    });

    return res.status(201).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
