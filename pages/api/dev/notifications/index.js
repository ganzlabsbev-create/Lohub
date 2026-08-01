import { requireActor, gasGet } from "../../../../lib/apiAuth";
import { getAllApps, getAllDevelopers } from "../../../../lib/serverData";
import { findDeveloperByGithubUsername } from "../../../../lib/auth";

// GET /api/dev/notifications
// -> { count, items } สำหรับกระดิ่งแจ้งเตือน — เฉพาะ role "developer" เท่านั้น
//    (admin ไม่มีกระดิ่งนี้ตามสเปก — ถ้า role ไม่ใช่ developer ตอบ 403 เฉยๆ ฝั่ง client จะซ่อนกระดิ่งไป)
//
// หมายเหตุสำคัญ: Google Sheet (GAS) ไม่มีข้อมูลว่า developer คนไหนเป็นเจ้าของแอปไหน — ข้อมูลนั้น
// อยู่ใน data/apps/*.json (field developer_id) ของโปรเจกต์นี้เท่านั้น เลยต้องคำนวณ app_ids ของ
// developer คนนี้ที่นี่ก่อน แล้วส่งไปกรองที่ GAS แทนการส่งแค่ username เฉยๆ
//
// GAS action: unread_reports_count_for_developer(app_ids)  — app_ids = comma-separated string
// -> { ok:true, data: { count: number, items: [{ report_id, app_id, app_name, message, created_at }] } }
// (items = รายงานที่ read_by_developer=false ของแอปใน app_ids เรียงล่าสุดก่อน จำกัดพอสำหรับ dropdown)
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });
    if (actor.role !== "developer") {
      return res.status(403).json({ error: "เฉพาะ developer เท่านั้น" });
    }

    const developers = getAllDevelopers();
    const developer = findDeveloperByGithubUsername(developers, actor.username);
    const myApps = developer ? getAllApps().filter((a) => a.developer_id === developer.id) : [];
    const myAppIds = myApps.map((a) => a.id);

    if (myAppIds.length === 0) return res.status(200).json({ count: 0, items: [] });

    const data = await gasGet("unread_reports_count_for_developer", { app_ids: myAppIds.join(",") });
    // GAS ไม่รู้จักชื่อแอป (อยู่ใน data/apps เท่านั้น) — แปะ app_name ให้ที่นี่ก่อนส่งกลับ client
    const nameById = Object.fromEntries(myApps.map((a) => [a.id, a.name]));
    const items = (data?.items || []).map((it) => ({ ...it, app_name: nameById[it.app_id] || it.app_id }));

    return res.status(200).json({ count: data?.count || 0, items });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
