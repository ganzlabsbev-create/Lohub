import { requireActor } from "../../../lib/apiAuth";
import { getAllDevelopers } from "../../../lib/serverData";
import { findDeveloperByGithubUsername } from "../../../lib/auth";
import { getSiteSettings } from "../../../lib/site";
import { validateDraftForm, buildAppDraft } from "../../../lib/appDraft";
import { getExistingSlugs, createAppSubmissionPR } from "../../../lib/githubCommit";

// เพิ่ม body size limit เพราะไอคอน/ภาพหน้าจอถูกส่งมาเป็น base64 (default ของ Next.js คือ 1mb ซึ่งเล็กไป)
export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

const MAX_SCREENSHOTS = 8;

// POST /api/dev/submit-app
// body: { form: <ค่าจากฟอร์ม /dev/submit ตรงกับที่ validateDraftForm ต้องการ>,
//         icon: { base64 },            // บังคับ — data URL หรือ base64 ล้วนก็ได้
//         screenshots: [{ base64 }] }  // ไม่บังคับ, สูงสุด 8 รูป เรียงตามลำดับที่แนบ
//
// แทนที่ addMockSubmission() เดิมใน lib/mockAuth.js — สร้าง branch ใหม่ + commit
// submissions/{slug}/app.json + icon.png + screenshots/*.png แล้วเปิด PR จริงผ่าน lib/githubCommit.js
// (pattern เดียวกับ createDeveloperProfilePR ที่ pages/api/admin/developer-requests.js ใช้อยู่แล้ว)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const actor = await requireActor(req, res);
    if (!actor) return res.status(401).json({ error: "ต้อง login ก่อน" });

    const developers = getAllDevelopers();
    const developer = findDeveloperByGithubUsername(developers, actor.username);
    if (!developer) {
      return res.status(403).json({
        error: "บัญชี GitHub นี้ยังไม่ได้ลงทะเบียนเป็นนักพัฒนาในระบบ",
      });
    }

    const { form, icon, screenshots } = req.body || {};
    if (!form || typeof form !== "object") {
      return res.status(400).json({ error: "missing form" });
    }
    if (!icon || !icon.base64) {
      return res.status(400).json({ error: "กรุณาแนบไอคอนแอป (icon.png)" });
    }

    const site = getSiteSettings();
    // เช็ค slug กับของจริงบน GitHub เสมอ (ไม่เชื่อ apps ที่ client ส่งมา เพราะอาจโหลด search-index.json
    // แบบ cache ค้างไว้) — รวมทั้งแอปที่ publish แล้วและแอปที่กำลังรอ PR merge อยู่
    const existingSlugs = await getExistingSlugs();
    const { valid, errors } = validateDraftForm(form, {
      existingSlugs: Array.from(existingSlugs),
      licenseOptions: site.license_options,
    });
    if (!valid) {
      return res.status(400).json({ error: "ข้อมูลในฟอร์มไม่ถูกต้อง", errors });
    }

    const screenshotFiles = (Array.isArray(screenshots) ? screenshots : [])
      .filter((s) => s && s.base64)
      .slice(0, MAX_SCREENSHOTS)
      .map((s, i) => ({
        base64: stripDataUrlPrefix(s.base64),
        filename: `${String(i + 1).padStart(2, "0")}.png`,
      }));

    // appId ใน draft นี้เป็นค่าชั่วคราว (อิง slug) — app_id จริงถูกกำหนดตอน merge/convert เท่านั้น
    // (ดูคอมเมนต์ใน lib/githubCommit.js:createAppSubmissionPR และ scripts/builder/convert-submissions.js)
    const draft = buildAppDraft(form, { developerId: developer.id, appId: form.slug.trim() });

    const result = await createAppSubmissionPR({
      slug: form.slug.trim(),
      draft,
      developerUsername: actor.username,
      iconBase64: stripDataUrlPrefix(icon.base64),
      screenshots: screenshotFiles,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}

function stripDataUrlPrefix(base64) {
  const idx = base64.indexOf(",");
  return base64.startsWith("data:") && idx !== -1 ? base64.slice(idx + 1) : base64;
}
