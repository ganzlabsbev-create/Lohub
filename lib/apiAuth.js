import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { getSiteSettings } from "./site";
import { getAllDevelopers, getAppById } from "./serverData";
import { findDeveloperByGithubUsername } from "./auth";
import { resolveRole } from "./userRole";
import { gasGet, gasPost } from "./sheetsClient";

// เรียกใน pages/api/** ทุกตัวที่ต้อง login — คืน { username, role, memberRow } หรือ null ถ้ายังไม่ login
// พร้อม "ensure_member" ให้อัตโนมัติ (สร้างแถวใน sheet members ให้ตอน login ครั้งแรก)
export async function requireActor(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const username = session?.user?.login;
  if (!username) return null;

  const memberRow = await gasPost("ensure_member", {
    username,
    display_name: session.user.name || username,
    avatar_url: session.user.image || "",
  });

  const site = getSiteSettings();
  const developers = getAllDevelopers();
  const role = resolveRole({ username, developers, site, memberRow });

  return { username, role, memberRow, site };
}

// เรียกต่อจาก requireActor เมื่อ endpoint ต้องการสิทธิ์ admin เท่านั้น
export function isActorAdmin(actor) {
  return !!actor && actor.role === "admin";
}

// Guard สำหรับ /api/dev/apps/[id]/** (inbox รายงานของแอป) — "ownership guard" ไม่ใช่ AdminGuard
// ตามสเปก dev-report-inbox: เช็คว่า app.developer_id ตรงกับ developer ของ session เท่านั้น
// (admin ไม่ผ่าน guard นี้ แม้จะเป็น admin ก็ตาม เพราะ /admin/reports เป็น read-only แยกไปแล้ว)
// คืน { actor, app, developer } ถ้าผ่าน, คืน { error, status } ถ้าไม่ผ่าน (ให้ caller ตอบ res เอง)
export async function requireAppOwner(req, res, appId) {
  const actor = await requireActor(req, res);
  if (!actor) return { error: "ต้อง login ก่อน", status: 401 };

  const app = getAppById(appId);
  if (!app) return { error: "ไม่พบแอปนี้", status: 404 };

  const developers = getAllDevelopers();
  const developer = findDeveloperByGithubUsername(developers, actor.username);
  if (!developer || app.developer_id !== developer.id) {
    return { error: "คุณไม่ใช่เจ้าของแอปนี้", status: 403 };
  }

  return { actor, app, developer };
}

export { gasGet, gasPost };
