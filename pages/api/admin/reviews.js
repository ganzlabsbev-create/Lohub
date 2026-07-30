import { requireActor, isActorAdmin, gasGet, gasPost } from "../../../lib/apiAuth";

// GET  /api/admin/reviews                                  -> รีวิวทั้งหมด (รวมที่ซ่อนแล้ว)
// POST /api/admin/reviews { review_id, action }             -> action: "hide" | "unhide" | "delete"
export default async function handler(req, res) {
  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    if (req.method === "GET") {
      const reviews = await gasGet("admin_reviews");
      return res.status(200).json({ reviews });
    }

    if (req.method === "POST") {
      const { review_id, action } = req.body || {};
      if (!review_id || !action) return res.status(400).json({ error: "missing review_id or action" });

      if (action === "delete") {
        const result = await gasPost("admin_delete_review", { review_id });
        return res.status(200).json({ result });
      }
      if (action === "hide" || action === "unhide") {
        const status = action === "hide" ? "hidden" : "visible";
        const result = await gasPost("admin_review_status", { review_id, status });
        return res.status(200).json({ result });
      }
      return res.status(400).json({ error: "invalid action" });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
