import { requireActor, gasGet, gasPost } from "../../../../../lib/apiAuth";

// POST /api/account/reports/rp_xxx/reply   { message }
// -> ผู้ส่งรายงาน (reporter) ตอบกลับเพิ่มในรายงานของตัวเองได้ (เปลี่ยนสถานะไม่ได้)
// ไม่มี action "get single report" ฝั่ง GAS จึงเช็คสิทธิ์โดยดึงรายงานทั้งหมดของ user นี้ก่อน
// (reports_for_reporter) แล้วยืนยันว่า reportId อยู่ในลิสต์ของตัวเองจริง ก่อนเรียก add_report_reply
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });

    const { reportId } = req.query;
    const { message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: "missing message" });

    const myReports = await gasGet("reports_for_reporter", { username: actor.username });
    const owns = (myReports || []).some((r) => r.id === reportId);
    if (!owns) return res.status(403).json({ error: "ไม่ใช่รายงานของคุณ" });

    // GAS action: add_report_reply(report_id, author_username, author_role, message)
    const reply = await gasPost("add_report_reply", {
      report_id: reportId,
      author_username: actor.username,
      author_role: "reporter",
      message: message.trim(),
    });

    return res.status(201).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
