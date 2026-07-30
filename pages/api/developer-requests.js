import { requireActor, gasGet, gasPost } from "../../lib/apiAuth";

// GET  /api/developer-requests   -> สถานะคำขอ Developer ล่าสุดของ user ที่ login อยู่ (pending/approved/rejected)
// POST /api/developer-requests { reason, portfolio_url }  -> ส่งคำขออัปเกรดเป็น Developer
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });

    if (req.method === "GET") {
      const request = await gasGet("my_developer_request", { username: actor.username });
      return res.status(200).json({ request });
    }

    if (req.method === "POST") {
      if (actor.role !== "member") {
        return res.status(400).json({ error: "คุณเป็น developer หรือ admin อยู่แล้ว" });
      }
      const { reason, portfolio_url } = req.body || {};
      const request = await gasPost("submit_developer_request", {
        username: actor.username,
        display_name: actor.memberRow?.display_name,
        reason,
        portfolio_url,
      });
      return res.status(201).json({ request });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
