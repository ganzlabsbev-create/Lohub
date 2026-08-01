import { requireActor, isActorAdmin, gasGet } from "../../../lib/apiAuth";

// GET /api/admin/reports
// -> รายงานปัญหาทั้งหมด + reply thread ของทุกแอป (อ่านอย่างเดียว)
//
// เปลี่ยนจากเดิม (dev-report-inbox-spec.md): เอาความสามารถ POST แก้สถานะออกทั้งหมด
// เพราะสิทธิ์เปลี่ยนสถานะรายงานย้ายไปเป็นของ developer เจ้าของแอปเท่านั้นแล้ว
// (ดู /api/dev/apps/[id]/reports/[reportId]/status.js) — admin เห็นได้แต่แก้ไม่ได้
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed — read-only now" });

  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    // GAS action เดิม admin_reports คืนแค่ reports; เพิ่ม admin_report_replies(report_id)
    // เพื่อดึง reply thread แนบไปด้วยทีละรายงาน (ดู GAS_ACTIONS_SPEC.md)
    const reports = await gasGet("admin_reports");
    const withReplies = await Promise.all(
      (reports || []).map(async (r) => {
        const replies = await gasGet("admin_report_replies", { report_id: r.id });
        return { ...r, replies: replies || [] };
      })
    );

    return res.status(200).json({ reports: withReplies });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
