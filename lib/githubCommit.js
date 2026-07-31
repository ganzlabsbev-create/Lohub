// เรียก GitHub REST API โดยตรง (ไม่ผ่าน Apps Script) — ใช้ได้เฉพาะฝั่ง server (pages/api/**) เท่านั้น
// ห้าม import ไฟล์นี้จาก component ฝั่ง client เด็ดขาด เพราะ GITHUB_COMMIT_TOKEN ต้องไม่หลุดไปที่ browser
// (แพทเทิร์นเดียวกับ lib/sheetsClient.js)
//
// หน้าที่:
// 1) ตอนแอดมินอนุมัติคำขอเป็น Developer ให้สร้างไฟล์ data/developers/{id}.json อัตโนมัติ
// 2) ตอน developer ส่งแอปใหม่ (Part 10) ให้สร้างไฟล์ submissions/{slug}/** อัตโนมัติ
// ทั้งสองแบบเปิด Pull Request เสมอ (ไม่ commit เข้า main ตรงๆ — ตั้งใจให้มีจุดตรวจสอบก่อน merge จริง)
// ฟังก์ชันระดับล่าง (createBranch/commitFile/openPullRequest/...) ใช้ร่วมกันทั้งสอง flow

const GITHUB_TOKEN = process.env.GITHUB_COMMIT_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // รูปแบบ "owner/repo"
const BASE_BRANCH = process.env.GITHUB_REPO_BRANCH || "main";
const API_BASE = "https://api.github.com";

function assertConfigured() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า GITHUB_COMMIT_TOKEN / GITHUB_REPO ใน Environment Variables"
    );
  }
}

async function gh(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `GitHub API error (HTTP ${res.status}) ที่ ${path}`);
  }
  return data;
}

// ดึงข้อมูลสาธารณะของ GitHub user (name/avatar/เว็บไซต์ที่ตั้งไว้ในโปรไฟล์ GitHub)
// ใช้เป็นค่า fallback เผื่อฟอร์มสมัครอัพเกรดไม่ได้กรอก หรือ backend (Apps Script) ยังไม่รองรับฟิลด์ใหม่
async function fetchGithubPublicProfile(username) {
  try {
    return await gh(`/users/${encodeURIComponent(username)}`);
  } catch {
    return null; // ไม่พังทั้งกระบวนการถ้าเรียกไม่สำเร็จ แค่ไม่มี fallback ให้ใช้
  }
}

async function getBaseBranchSha() {
  const ref = await gh(`/repos/${GITHUB_REPO}/git/ref/heads/${BASE_BRANCH}`);
  return ref.object.sha;
}

// นับไฟล์ที่มีอยู่ใน data/developers/ ของ branch หลัก เพื่อคำนวณ id ถัดไปแบบ dev_000N
// หมายเหตุ: ถ้ามีการอนุมัติ 2 คำขอพร้อมกันในเวลาไล่เลี่ยกันมากๆ อาจได้ id ซ้ำ (ความเสี่ยงต่ำ ยอมรับไว้ก่อน)
async function nextDeveloperId() {
  const items = await gh(`/repos/${GITHUB_REPO}/contents/data/developers?ref=${BASE_BRANCH}`);
  const count = (Array.isArray(items) ? items : []).filter((f) => f.name.endsWith(".json")).length;
  return `dev_${String(count + 1).padStart(4, "0")}`;
}

async function createBranch(branchName, fromSha) {
  await gh(`/repos/${GITHUB_REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
  });
}

// content ต้องเป็น base64 string อยู่แล้ว (ไม่ใช่ data URL ที่มี "data:...;base64," นำหน้า)
// ใช้ได้ทั้งไฟล์ JSON (ผ่าน jsonToBase64 ก่อน) และไฟล์รูปภาพ/ไบนารีอื่นๆ
async function commitFile(branchName, filePath, contentBase64, message) {
  await gh(`/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: contentBase64, branch: branchName }),
  });
}

function jsonToBase64(jsonObject) {
  return Buffer.from(JSON.stringify(jsonObject, null, 2) + "\n", "utf-8").toString("base64");
}

async function openPullRequest({ branchName, title, body }) {
  return gh(`/repos/${GITHUB_REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head: branchName, base: BASE_BRANCH, body }),
  });
}

// จุดเข้าใช้งานหลัก — เรียกจาก pages/api/admin/developer-requests.js หลัง gasPost อนุมัติสำเร็จ
// request: { username, display_name, website, contact, reason, portfolio_url }
export async function createDeveloperProfilePR(request) {
  assertConfigured();

  const [baseSha, ghProfile, id] = await Promise.all([
    getBaseBranchSha(),
    fetchGithubPublicProfile(request.username),
    nextDeveloperId(),
  ]);

  const developer = {
    schema_version: "1.0",
    id,
    name: request.display_name || ghProfile?.name || request.username,
    github_username: request.username,
    website: request.website || ghProfile?.blog || "",
    avatar: ghProfile?.avatar_url || "",
    contact: request.contact || "",
    verified: true,
    status: "active",
    joined_at: new Date().toISOString(),
  };

  const branchName = `add-developer-${request.username}-${Date.now()}`;
  await createBranch(branchName, baseSha);
  await commitFile(
    branchName,
    `data/developers/${id}.json`,
    jsonToBase64(developer),
    `feat: เพิ่มนักพัฒนาใหม่ ${request.username} (${id})`
  );

  const bodyLines = [
    `อนุมัติคำขอเป็น Developer ของ @${request.username} แล้ว — PR นี้สร้างอัตโนมัติ`,
    "",
    request.reason ? `**เหตุผล:** ${request.reason}` : null,
    request.portfolio_url ? `**ผลงาน:** ${request.portfolio_url}` : null,
    "",
    "ตรวจไฟล์ `data/developers/" + id + ".json` แล้วกด merge เพื่อให้ขึ้นเว็บจริง",
  ].filter(Boolean);

  const pr = await openPullRequest({
    branchName,
    title: `เพิ่มนักพัฒนาใหม่: ${request.username}`,
    body: bodyLines.join("\n"),
  });

  return { id, pr_url: pr.html_url, pr_number: pr.number };
}

// ---------- ระบบส่งแอปใหม่แบบ PR (แทน mock localStorage เดิมใน lib/mockAuth.js) ----------

// อ่าน public/search-index.json ของ branch หลักตรงๆ ผ่าน Contents API (ไม่ใช้ fs ในเครื่อง เพราะ
// serverless function อาจรัน build เก่ากว่า main ปัจจุบันอยู่ — ต้องเช็ค slug กับของจริงบน GitHub เสมอ)
async function getPublicSearchIndex() {
  try {
    const file = await gh(`/repos/${GITHUB_REPO}/contents/public/search-index.json?ref=${BASE_BRANCH}`);
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
  } catch {
    return { apps: [] }; // ไม่มีไฟล์ก็แปลว่ายังไม่มีแอปเลย ไม่ควรพังทั้งกระบวนการ
  }
}

// รายชื่อ slug ที่มีคน "ส่งค้างไว้" อยู่แล้ว (มี PR เปิดรออยู่ ยังไม่ merge) — กันไม่ให้ 2 คนส่ง slug
// ชนกันตอนที่ยังไม่ทันถูก merge เข้า data/apps/ (search-index.json อย่างเดียวเช็คไม่ทันเคสนี้)
async function listSubmissionSlugs() {
  try {
    const items = await gh(`/repos/${GITHUB_REPO}/contents/submissions?ref=${BASE_BRANCH}`);
    return (Array.isArray(items) ? items : []).filter((f) => f.type === "dir").map((f) => f.name);
  } catch {
    return []; // ยังไม่เคยมีใครส่งแอปเลย โฟลเดอร์ submissions/ เลยยังไม่มีอยู่จริง
  }
}

// รวม slug ที่ "ใช้ไปแล้ว" ทั้งแอปที่ publish แล้ว (search-index.json) และแอปที่กำลังรอ PR merge (submissions/)
export async function getExistingSlugs() {
  assertConfigured();
  const [searchIndex, submissionSlugs] = await Promise.all([
    getPublicSearchIndex(),
    listSubmissionSlugs(),
  ]);
  const publishedSlugs = (searchIndex.apps || []).map((a) => a.slug).filter(Boolean);
  return new Set([...publishedSlugs, ...submissionSlugs]);
}

// จุดเข้าใช้งานหลัก — เรียกจาก pages/api/dev/submit-app.js
// draft: object จาก buildAppDraft() (lib/appDraft.js) — id/icon.path ใน draft นี้เป็นค่าชั่วคราวอิง slug
// เพราะ app_id จริงยังไม่ถูกกำหนด (กันชนกันตาม PLAN — ให้ตอน merge/convert เป็นคนกำหนดแทน ดู
// scripts/builder/convert-submissions.js) โครงสร้างไฟล์ที่ commit ตรงตามสเปก: submissions/{slug}/app.json,
// icon.png, screenshots/{01,02,...}.png
// icon/screenshots ต้องเป็น base64 ล้วน (ไม่มี data URL prefix) — ฝั่งเรียกต้อง strip ออกก่อน
export async function createAppSubmissionPR({ slug, draft, developerUsername, iconBase64, screenshots }) {
  assertConfigured();

  const baseSha = await getBaseBranchSha();
  const branchName = `submit-app-${slug}-${Date.now()}`;
  await createBranch(branchName, baseSha);

  await commitFile(
    branchName,
    `submissions/${slug}/app.json`,
    jsonToBase64(draft),
    `feat: ส่งแอปใหม่ ${draft.name} (${slug})`
  );
  await commitFile(
    branchName,
    `submissions/${slug}/icon.png`,
    iconBase64,
    `feat: ไอคอนแอป ${slug}`
  );
  // commit ทีละไฟล์ตามลำดับ (ไม่ยิงพร้อมกัน) เพราะ Contents API PUT แต่ละครั้งสร้าง commit ใหม่บน
  // head ปัจจุบันของ branch — ยิงพร้อมกันเสี่ยง 409 conflict เพราะแย่งกัน update ref เดียวกัน
  for (const shot of screenshots || []) {
    await commitFile(
      branchName,
      `submissions/${slug}/screenshots/${shot.filename}`,
      shot.base64,
      `feat: ภาพหน้าจอ ${slug}/${shot.filename}`
    );
  }

  const bodyLines = [
    `ส่งแอปใหม่โดย @${developerUsername} — PR นี้สร้างอัตโนมัติจากฟอร์ม /dev/submit`,
    "",
    `**ชื่อแอป:** ${draft.name}`,
    `**คำอธิบายสั้น:** ${draft.description_short}`,
    `**จำนวนภาพหน้าจอ:** ${(screenshots || []).length}`,
    "",
    `ตรวจไฟล์ใน \`submissions/${slug}/\` แล้วกด merge — หลัง merge ระบบจะกำหนด app_id จริงแบบกันชนกัน,`,
    "ย้ายไอคอน/ภาพหน้าจอไป public/assets/, เขียน data/apps/{app_id}.json และลบโฟลเดอร์นี้ทิ้งให้อัตโนมัติ",
    "(ดู .github/workflows/convert-submissions.yml)",
  ];

  const pr = await openPullRequest({
    branchName,
    title: `ส่งแอปใหม่: ${draft.name}`,
    body: bodyLines.join("\n"),
  });

  return { slug, pr_url: pr.html_url, pr_number: pr.number };
}
