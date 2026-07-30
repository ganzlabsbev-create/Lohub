import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { getSiteSettings } from "./site";
import { getAllDevelopers } from "./serverData";
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

export { gasGet, gasPost };
