import { useMemo } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import DevGuard from "../../components/DevGuard";
import AppIcon from "../../components/AppIcon";
import StatusBadge from "../../components/StatusBadge";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { formatDate } from "../../lib/format";
import { getMockSubmissions, getMockAppUpdate } from "../../lib/mockAuth";
import { getMockApprovedApps, getMockRejectedFor } from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

export default function DashboardPage({ site }) {
  const { loading, error, data } = useSearchIndex();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>Dashboard นักพัฒนา</h1>
        </div>
        <p className="banner-note">
          รวมสถานะแอปทั้งหมดที่คุณส่งเข้ามา — แอปที่ผ่านแล้วขึ้นเว็บจริง ส่วนแอปที่ยัง &quot;รอตรวจ&quot;
          ยังเป็น draft ในเครื่องนี้ (โหมดทดสอบ รอต่อระบบ PR จริงใน Part 10)
        </p>

        {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
        {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}

        {data && (
          <DevGuard developers={data.developers}>
            {(developer) => <DashboardBody developer={developer} apps={data.apps} />}
          </DevGuard>
        )}
      </section>
    </Layout>
  );
}

function DashboardBody({ developer, apps }) {
  const items = useMemo(() => buildDashboardItems(developer, apps), [developer, apps]);

  return (
    <>
      <div className="form-actions" style={{ marginBottom: 22 }}>
        <Link href="/dev/submit" className="btn-primary">
          ➕ ส่งแอปใหม่
        </Link>
      </div>

      {items.length === 0 ? (
        <StateMessage kind="empty">
          ยังไม่มีแอปที่ส่งเข้ามาในนาม <strong>{developer.name}</strong> —{" "}
          <Link href="/dev/submit">ส่งแอปแรกของคุณ</Link>
        </StateMessage>
      ) : (
        <ul className="dash-list">
          {items.map((item) => (
            <li key={item.id} className="dash-item">
              <AppIcon app={item} size={48} />
              <div className="dash-item__body">
                <div className="dash-item__top">
                  <h3>{item.name}</h3>
                  <StatusBadge status={item.status} title={item.reason} />
                </div>
                <p className="dash-item__meta mono">
                  v{item.version} · อัปเดตล่าสุด {formatDate(item.updated_at)}
                </p>
                {item.reason && <p className="dash-item__reason">เหตุผล: {item.reason}</p>}
              </div>
              <div className="dash-item__actions">
                {item.viewHref && (
                  <Link href={item.viewHref} className="btn-secondary btn-small">
                    ดูหน้าแอป
                  </Link>
                )}
                {item.editHref && (
                  <Link href={item.editHref} className="btn-secondary btn-small">
                    {item.status === "pending" ? "แก้ไข draft" : "อัปเดตเวอร์ชัน"}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// รวมรายการแอปที่ "ผ่านแล้ว" (จาก search-index จริง + จาก mock-approve ของ admin ใน Part 8)
// + draft ที่ "รอตรวจ" + draft ที่ "ถูกตีกลับ" (จาก localStorage) ของ dev คนนี้ — เรียงตาม updated_at ล่าสุดก่อน
function buildDashboardItems(developer, apps) {
  // mock-approve (Part 8) ยังไม่ได้อยู่ใน search-index.json จริง (client เขียนไฟล์ไม่ได้) เลยต้องรวมเข้ามาที่นี่
  const allApps = [...apps, ...Object.values(getMockApprovedApps())];

  const published = allApps
    .filter((a) => a.developer_id === developer.id)
    .map((a) => {
      const pendingUpdate = getMockAppUpdate(a.id);
      return {
        id: a.id,
        name: a.name,
        icon: a.icon,
        status: pendingUpdate ? "published-updating" : "published",
        version: pendingUpdate ? pendingUpdate.current_version : a.current_version,
        updated_at: pendingUpdate ? pendingUpdate.updated_at : a.updated_at,
        viewHref: `/app/${a.slug}`,
        editHref: `/dev/apps/${a.id}/edit`,
      };
    });

  const pending = getMockSubmissions()
    .filter((s) => s.developer_id === developer.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      status: "pending",
      version: s.current_version,
      updated_at: s.updated_at,
      viewHref: null,
      editHref: `/dev/apps/${s.id}/edit`,
    }));

  // draft ที่ admin ปฏิเสธแล้ว (Part 8) — ยังไม่มีหน้าแก้ไข/ส่งใหม่ (ทำ Part ถัดไป) เลยไม่มี editHref
  const rejected = getMockRejectedFor(developer.id).map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    status: "rejected",
    reason: r.reject_reason,
    version: r.current_version,
    updated_at: r.updated_at,
    viewHref: null,
    editHref: null,
  }));

  return [...published, ...pending, ...rejected].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );
}
