import { useSession, signIn } from "next-auth/react";
import StateMessage from "./StateMessage";
import { isAdminUsername } from "../lib/auth";
import { useTranslation } from "../lib/i18n";

// ป้องกันหน้าฝั่ง Admin ด้วย GitHub OAuth จริง (Part 10 — ก่อนหน้านี้ทุกหน้า /admin/* เข้าดูได้อิสระ)
// site: props "site" ที่ทุกหน้า Admin โหลดมาจาก getStaticProps อยู่แล้ว (มี admin_github_usernames)
// children: JSX ปกติ (ไม่ใช่ render-prop เหมือน DevGuard เพราะหน้า Admin ไม่ต้องใช้ข้อมูล developer)
export default function AdminGuard({ site, children }) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  if (status === "loading") {
    return <StateMessage kind="loading">{t("adminGuard.checking")}</StateMessage>;
  }

  if (!session) {
    return (
      <StateMessage kind="empty">
        {t("adminGuard.onlyAdmin")}{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          {t("common.loginWithGithub")}
        </button>
      </StateMessage>
    );
  }

  const username = session.user?.login;
  if (!isAdminUsername(username, site)) {
    return (
      <StateMessage kind="error">
        {t("adminGuard.githubAccount")} @{username} {t("adminGuard.noPermission")}{" "}
        <code>admin_github_usernames</code> {t("adminGuard.atFile")} <code>data/settings/site.json</code>
      </StateMessage>
    );
  }

  return children;
}
