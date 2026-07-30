import { requireActor, gasGet, gasPost } from "../../lib/apiAuth";

// GET  /api/reviews?app_id=app_0001        -> รายการรีวิวที่มองเห็นได้ของแอปนั้น (สาธารณะ ไม่ต้อง login)
// POST /api/reviews  { app_id, rating, comment }  -> ส่งรีวิวใหม่ (ต้อง login)
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { app_id } = req.query;
      if (!app_id) return res.status(400).json({ error: "missing app_id" });
      const reviews = await gasGet("reviews_for_app", { app_id });
      return res.status(200).json({ reviews });
    }

    if (req.method === "POST") {
      const actor = await requireActor(req, res);
      if (!actor) return res.status(401).json({ error: "ต้อง login ก่อนส่งรีวิว" });

      const { app_id, rating, comment } = req.body || {};
      if (!app_id || !rating) return res.status(400).json({ error: "missing app_id or rating" });

      const review = await gasPost("submit_review", {
        username: actor.username,
        app_id,
        rating,
        comment,
      });
      return res.status(201).json({ review });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
