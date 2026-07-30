import { useSession, signIn } from "next-auth/react";
import StateMessage from "./StateMessage";
import { findDeveloperByGithubUsername } from "../lib/auth";

// ป้องกันหน้าฝั่ง Developer ด้วย GitHub OAuth จริง (Part 10 — แทน mock picker เดิม)
// developers: array ของ data.developers ที่โหลดมาแล้ว (จาก search-index.json)
// children ต้องเป็นฟังก์ชัน (developer) => JSX — อินเทอร์เฟซเดิมไม่เปลี่ยน (Part 6/7 เรียกใช้ต่อได้เลย)
export default function DevGuard({ developers, children }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <StateMessage kind="loading">กำลังตรวจสอบสถานะเข้าสู่ระบบ...</StateMessage>;
  }

  if (!session) {
    return (
      <StateMessage kind="empty">
        คุณยังไม่ได้เข้าสู่ระบบนักพัฒนา —{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          เข้าสู่ระบบด้วย GitHub
        </button>
      </StateMessage>
    );
  }

  const username = session.user?.login;
  const developer = findDeveloperByGithubUsername(developers, username);
  if (!developer) {
    return (
      <StateMessage kind="empty">
        บัญชี GitHub @{username} ยังไม่ได้ลงทะเบียนเป็นนักพัฒนาในระบบนี้ — ให้ Admin เพิ่มไฟล์ใน{" "}
        <code>data/developers/</code> ที่มี <code>github_username</code> ตรงกับบัญชีนี้ก่อน
      </StateMessage>
    );
  }

  return children(developer);
}
