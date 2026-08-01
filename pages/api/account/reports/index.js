import { requireActor, gasGet } from "../../../../lib/apiAuth";

// GET /api/account/reports
// -> รายงานทั้งหมดที่ user ที่ login อยู่เคยส่ง พร้อมสถานะ + reply thread (สำหรับหน้า /account)
// GAS action: reports_for_reporter(username) -> [{ ...report, replies: [...] }]
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });

    const reports = await gasGet("reports_for_reporter", { username: actor.username });
    return res.status(200).json({ reports });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
