import { requireActor, isActorAdmin } from "../../../../../lib/apiAuth";
import { assertAdminConfigured, mergeSubmissionPR } from "../../../../../lib/githubAdmin";

// PATCH /api/admin/apps/submission-prs/42  body: { action: "merge" }
//
// Merge PR ส่งแอปใหม่เข้า main ให้จากในเว็บเลย (ไม่ต้องออกไปกดที่ GitHub อีกต่อไป) หลัง merge สำเร็จ
// .github/workflows/convert-submissions.yml จะรันอัตโนมัติสร้าง data/apps/{app_id}.json (status: pending)
// ให้ — รอ Action รันเสร็จ (ปกติไม่กี่สิบวินาทีถึง ~1-2 นาที) แล้ว refresh คิวด้านล่างเพื่ออนุมัติต่อ
export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!isActorAdmin(actor)) return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });

    const { number } = req.query;
    const { action } = req.body || {};
    if (!number) return res.status(400).json({ error: "missing PR number" });
    if (action !== "merge") return res.status(400).json({ error: "action ต้องเป็น merge" });

    assertAdminConfigured();

    const result = await mergeSubmissionPR(number);
    if (!result.merged) {
      return res.status(409).json({ error: result.message || "merge ไม่สำเร็จ (อาจมี conflict)" });
    }
    return res.status(200).json({ merged: true, sha: result.sha });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
                                     }
      
