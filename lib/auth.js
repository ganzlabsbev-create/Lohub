// ผูก session.user.login (GitHub username จาก NextAuth) เข้ากับข้อมูลที่มีอยู่แล้ว
// - Developer: จับคู่กับ field "github_username" ใน data/developers/{id}.json
// - Admin: เทียบกับ "admin_github_usernames" ใน data/settings/site.json
// ไม่ต้องมีตาราง user/role แยกต่างหาก เพราะ repo เดิมมีข้อมูลนักพัฒนาอยู่แล้ว

export function findDeveloperByGithubUsername(developers, username) {
  if (!username) return null;
  return (
    (developers || []).find(
      (d) => (d.github_username || "").toLowerCase() === username.toLowerCase()
    ) || null
  );
}

export function isAdminUsername(username, site) {
  if (!username) return false;
  const list = (site && site.admin_github_usernames) || [];
  return list.some((u) => u.toLowerCase() === username.toLowerCase());
}
