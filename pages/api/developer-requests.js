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
      const { reason, portfolio_url, display_name, website, contact } = req.body || {};
      // หมายเหตุ: display_name/website/contact เป็นฟิลด์เสริมสำหรับตอนสร้างโปรไฟล์นักพัฒนาอัตโนมัติ
      // (ดู lib/githubCommit.js) — ถ้า Apps Script backend ยังไม่รองรับคอลัมน์พวกนี้ใน sheet
      // "developer_requests" ค่าจะถูกส่งไปเฉยๆ ไม่พัง แค่ admin_developer_requests อาจไม่คืนค่ากลับมา
      // (ตอน approve จะ fallback ไปใช้ข้อมูลโปรไฟล์สาธารณะจาก GitHub แทน)
      const request = await gasPost("submit_developer_request", {
        username: actor.username,
        display_name: display_name || actor.memberRow?.display_name,
        reason,
        portfolio_url,
        website,
        contact,
      });
      return res.status(201).json({ request });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
