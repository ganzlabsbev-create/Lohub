import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จุดเข้า Admin Panel เดียว (/admin) — ก่อนหน้านี้ไม่มีหน้านี้ มีแต่ปุ่มลิงก์แยกไปแต่ละหน้าย่อย
// (queue/categories/developers/...) ที่แปะไว้ในหน้า Account โดยตรง ตอนนี้ Account เหลือปุ่มเดียวมาที่นี่
// แล้วหน้านี้พาไปแท็บแรก (คิวรอตรวจ) ต่อ — AdminNav ในแต่ละหน้าย่อยใช้สลับแท็บกันเองอยู่แล้ว
export default function AdminIndexPage({ site }) {
  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <AdminRedirect />
      </AdminGuard>
    </Layout>
  );
}

function AdminRedirect() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace("/admin/queue");
  }, [router]);

  return <StateMessage kind="loading">{t("adminIndex.redirecting")}</StateMessage>;
}
