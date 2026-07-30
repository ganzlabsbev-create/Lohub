import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import DevAvatar from "../../components/DevAvatar";
import StatusBadge from "../../components/StatusBadge";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { formatDate } from "../../lib/format";
import { getEffectiveDevelopers, setMockDeveloperStatus } from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: หน้านี้จำกัดเฉพาะบัญชีที่อยู่ใน admin_github_usernames (ดู AdminGuard)
export default function AdminDevelopersPage({ site }) {
  const { loading, error, data } = useSearchIndex();
  const [list, setList] = useState(null);

  useEffect(() => {
    if (data) setList(getEffectiveDevelopers(data.developers));
  }, [data]);

  function refresh() {
    if (data) setList(getEffectiveDevelopers(data.developers));
  }

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="developers" />
          <div className="section__head">
            <h1>จัดการนักพัฒนา</h1>
          </div>
          <p className="banner-note">
            ระงับนักพัฒนาที่ทำผิดกติกา หรือเปิดใช้งานคืนได้ — สถานะเก็บไว้ในเครื่องนี้เท่านั้น (
            <code>data/developers/*.json</code> จริงยังแก้ไม่ได้ตรงๆ รอ Part 10 ต่อเป็น PR) การระงับตอนนี้ยังไม่ได้ไป
            บล็อกการส่งแอปใหม่หรือซ่อนแอปเดิมของนักพัฒนาคนนั้นบนหน้าเว็บ (ทำต่อได้ในตอนถัดไปถ้าต้องการ)
          </p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}

          {data && list && (
            <ul className="dev-list">
              {list.map((developer) => (
                <DeveloperRow
                  key={developer.id}
                  developer={developer}
                  appCount={data.apps.filter((a) => a.developer_id === developer.id).length}
                  onChanged={refresh}
                />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function DeveloperRow({ developer, appCount, onChanged }) {
  const suspended = developer.status === "suspended";

  function toggle() {
    setMockDeveloperStatus(developer.id, suspended ? "active" : "suspended");
    onChanged();
  }

  return (
    <li className="dev-row">
      <DevAvatar developer={developer} size={48} />

      <div className="dev-row__body">
        <p className="dev-row__name">
          {developer.name}
          {developer.verified && (
            <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">✓ verified</span>
          )}
        </p>
        <p className="dev-row__meta mono">
          {developer.id} · @{developer.github_username} · เข้าร่วมเมื่อ {formatDate(developer.joined_at)} ·{" "}
          {appCount} แอป
        </p>
      </div>

      <StatusBadge status={developer.status} />

      <div className="dev-row__actions">
        <Link href={`/developer/${developer.id}`} className="btn-secondary btn-small">
          ดูโปรไฟล์
        </Link>
        <button
          type="button"
          className={suspended ? "btn-primary btn-small" : "btn-danger btn-small"}
          onClick={toggle}
        >
          {suspended ? "เปิดใช้งานอีกครั้ง" : "ระงับบัญชี"}
        </button>
      </div>
    </li>
  );
}
