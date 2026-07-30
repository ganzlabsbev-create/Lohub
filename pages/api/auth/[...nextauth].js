import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// ระบบ login จริงตัวเดียวของทั้งเว็บ (Developer + Admin ใช้ร่วมกัน)
// แทนที่ mock picker เดิมใน lib/mockAuth.js (getCurrentDeveloperId/setCurrentDeveloperId)
// สิทธิ์ Developer/Admin ไม่ได้เก็บใน NextAuth เอง — เช็คแยกทีหลังโดยจับคู่ session.user.login
// (GitHub username) กับ data/developers/*.json (field github_username) และ
// data/settings/site.json (field admin_github_usernames) ดู lib/auth.js
export default NextAuth({
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
    // เก็บ GitHub username ไว้ใน token ตอน login (profile มีให้เฉพาะตอนนั้น)
    async jwt({ token, profile }) {
      if (profile) token.login = profile.login;
      return token;
    },
    // ส่ง username ต่อเข้า session ให้ฝั่ง client (useSession) อ่านได้
    async session({ session, token }) {
      if (session.user) session.user.login = token.login;
      return session;
    },
  },
});
