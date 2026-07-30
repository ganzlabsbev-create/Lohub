import { requireActor } from "../../lib/apiAuth";

// GET /api/profile
// - login ครั้งแรก: sheet "members" จะไม่มีแถวของ user นี้ -> requireActor จะสร้างให้อัตโนมัติ (ensure_member)
// - ครั้งต่อไป: คืนแถวเดิม
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });

    return res.status(200).json({
      username: actor.username,
      role: actor.role,
      profile: actor.memberRow,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
