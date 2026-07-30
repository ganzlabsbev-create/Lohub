import { requireActor, isActorAdmin, gasGet, gasPost } from "../../../lib/apiAuth";

// GET  /api/admin/reports                             -> รายงานปัญหาทั้งหมด
// POST /api/admin/reports { report_id, status }        -> status: "open" | "reviewed" | "resolved"
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    if (req.method === "GET") {
      const reports = await gasGet("admin_reports");
      return res.status(200).json({ reports });
    }

    if (req.method === "POST") {
      const { report_id, status } = req.body || {};
      if (!report_id || !status) return res.status(400).json({ error: "missing report_id or status" });
      const result = await gasPost("admin_report_status", { report_id, status });
      return res.status(200).json({ result });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
