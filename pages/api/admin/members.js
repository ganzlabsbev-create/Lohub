import { requireActor, isActorAdmin, gasGet, gasPost } from "../../../lib/apiAuth";

// GET  /api/admin/members                              -> รายชื่อสมาชิกทั้งหมด
// POST /api/admin/members { username, verified }        -> ให้/ถอน verified badge
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    if (req.method === "GET") {
      const members = await gasGet("admin_members");
      return res.status(200).json({ members });
    }

    if (req.method === "POST") {
      const { username, verified } = req.body || {};
      if (!username) return res.status(400).json({ error: "missing username" });
      const result = await gasPost("admin_set_verified", { username, verified: !!verified });
      return res.status(200).json({ result });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
