import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// ระบบ login จริงตัวเดียวของทั้งเว็บ (Developer + Admin ใช้ร่วมกัน)
// สิทธิ์ Developer/Admin ไม่ได้เก็บใน NextAuth เอง — เช็คแยกทีหลังโดยจับคู่ session.user.login
// (GitHub username) กับ data/developers/*.json, data/settings/site.json และ sheet "members" (ดู lib/auth.js, lib/userRole.js)
//
// เปลี่ยนจากเดิม: แยก authOptions เป็น named export เพื่อให้ pages/api/** อื่นๆ
// (เช่น /api/profile, /api/reviews) เรียก getServerSession(req, res, authOptions) ได้
export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) token.login = profile.login;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.login = token.login;
      return session;
    },
  },
};

export default NextAuth(authOptions);
