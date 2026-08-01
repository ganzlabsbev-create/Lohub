import { requireAppOwner, gasGet } from "../../../../../../lib/apiAuth";

// GET /api/dev/apps/app_0001/reports?status=open
// -> รายงานปัญหา + reply thread ทั้งหมดของแอปนี้ (เฉพาะ developer เจ้าของแอปเท่านั้น)
// guard: requireAppOwner เช็ค app.developer_id ตรงกับ developer ของ session (ไม่ใช่ AdminGuard)
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const { id, status } = req.query;
    const guard = await requireAppOwner(req, res, id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    // GAS action: reports_for_app(app_id) -> { ok:true, data: [{ ...report, replies: [...] }] }
    // (ดูสเปกที่ GAS_ACTIONS_SPEC.md — คืนรายงานเรียงล่าสุดก่อน พร้อม replies ของแต่ละรายงาน)
    let reports = await gasGet("reports_for_app", { app_id: id });
    if (status) reports = reports.filter((r) => r.status === status);

    return res.status(200).json({ reports });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
