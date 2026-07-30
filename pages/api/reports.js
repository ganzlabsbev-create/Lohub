import { requireActor, gasPost } from "../../lib/apiAuth";

// POST /api/reports  { app_id, type, message }  -> ส่งรายงานปัญหาของแอป (ต้อง login)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อนส่งรายงาน" });

    const { app_id, type, message } = req.body || {};
    if (!app_id || !message) return res.status(400).json({ error: "missing app_id or message" });

    const report = await gasPost("submit_report", {
      username: actor.username,
      app_id,
      type,
      message,
    });
    return res.status(201).json({ report });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
