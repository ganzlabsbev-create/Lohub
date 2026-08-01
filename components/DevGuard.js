import { useSession, signIn } from "next-auth/react";
import StateMessage from "./StateMessage";
import { findDeveloperByGithubUsername } from "../lib/auth";
import { useTranslation } from "../lib/i18n";

// ป้องกันหน้าฝั่ง Developer ด้วย GitHub OAuth จริง (Part 10 — แทน mock picker เดิม)
// developers: array ของ data.developers ที่โหลดมาแล้ว (จาก search-index.json)
// children ต้องเป็นฟังก์ชัน (developer) => JSX — อินเทอร์เฟซเดิมไม่เปลี่ยน (Part 6/7 เรียกใช้ต่อได้เลย)
export default function DevGuard({ developers, children }) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  if (status === "loading") {
    return <StateMessage kind="loading">{t("devGuard.checking")}</StateMessage>;
  }

  if (!session) {
    return (
      <StateMessage kind="empty">
        {t("devGuard.notLoggedIn")}{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          {t("common.loginWithGithub")}
        </button>
      </StateMessage>
    );
  }

  const username = session.user?.login;
  const developer = findDeveloperByGithubUsername(developers, username);
  if (!developer) {
    return (
      <StateMessage kind="empty">
        {t("adminGuard.githubAccount")} @{username} {t("devGuard.notRegistered")}{" "}
        <code>data/developers/</code> {t("devGuard.withMatchingField")} <code>github_username</code> {t("devGuard.matchingAccount")}
      </StateMessage>
    );
  }

  return children(developer);
}
