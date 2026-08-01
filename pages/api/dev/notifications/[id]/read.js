import { requireAppOwner, gasPost } from "../../../../../lib/apiAuth";

// POST /api/dev/notifications/rp_xxx/read   body: { app_id }
// -> mark รายงานเป็นอ่านแล้ว — ต้องแนบ app_id มาด้วยเพื่อให้ตรวจความเป็นเจ้าของแอปก่อน
//    (ไม่มี action "get single report" ฝั่ง GAS เลยต้องพึ่ง app_id ที่ client ส่งมาจาก
//    รายการ notification เดิม (bell dropdown) ยืนยันสิทธิ์ก่อนเรียก mark_report_read เสมอ)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const { id } = req.query;
    const { app_id } = req.body || {};
    if (!app_id) return res.status(400).json({ error: "missing app_id" });

    const guard = await requireAppOwner(req, res, app_id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    // GAS action: mark_report_read(report_id) -> เซ็ต read_by_developer=true, read_at=now
    const result = await gasPost("mark_report_read", { report_id: id });
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
