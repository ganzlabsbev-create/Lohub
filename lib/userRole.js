import { findDeveloperByGithubUsername, isAdminUsername } from "./auth";

// ตัดสิน role ของผู้ใช้ตามลำดับความสำคัญ: admin > developer > member
// - admin: อยู่ใน site.admin_github_usernames (ของเดิม)
// - developer: มี profile อยู่แล้วใน data/developers/*.json (ของเดิม) หรือ role ใน sheet "members"
//   ถูกอัปเป็น "developer" แล้ว (หลัง Admin อนุมัติ developer_requests)
// - member: ที่เหลือทั้งหมดที่ login แล้ว
export function resolveRole({ username, developers, site, memberRow }) {
  if (isAdminUsername(username, site)) return "admin";
  if (findDeveloperByGithubUsername(developers, username)) return "developer";
  if (memberRow && memberRow.role === "developer") return "developer";
  return "member";
}
