// เรียก GitHub REST API โดยตรง (ไม่ผ่าน Apps Script) — ใช้ได้เฉพาะฝั่ง server (pages/api/**) เท่านั้น
// ห้าม import ไฟล์นี้จาก component ฝั่ง client เด็ดขาด เพราะ GITHUB_COMMIT_TOKEN ต้องไม่หลุดไปที่ browser
// (แพทเทิร์นเดียวกับ lib/sheetsClient.js)
//
// หน้าที่: ตอนแอดมินอนุมัติคำขอเป็น Developer ให้สร้างไฟล์ data/developers/{id}.json อัตโนมัติ
// แล้วเปิด Pull Request (ไม่ commit เข้า main ตรงๆ — ตั้งใจให้มีจุดตรวจสอบก่อน merge จริง)

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

async function commitFile(branchName, filePath, jsonObject, message) {
  const content = Buffer.from(JSON.stringify(jsonObject, null, 2) + "\n", "utf-8").toString("base64");
  await gh(`/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content, branch: branchName }),
  });
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
    developer,
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
