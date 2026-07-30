import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import AppIcon from "../../components/AppIcon";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { formatDate, formatSize } from "../../lib/format";
import { getPendingQueue, approveMockSubmission, rejectMockSubmission } from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: หน้านี้จำกัดเฉพาะบัญชีที่อยู่ใน admin_github_usernames (ดู AdminGuard)
export default function AdminQueuePage({ site }) {
  const { loading, error, data } = useSearchIndex();
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    setQueue(getPendingQueue());
  }, []);

  function refresh() {
    setQueue(getPendingQueue());
  }

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="queue" />
          <div className="section__head">
            <h1>คิวรอตรวจ</h1>
          </div>
          <p className="banner-note">
            รายการแอปที่ developer ส่งเข้ามาและยังไม่ผ่านการตรวจ — ในระบบจริง (Part 10) ทุกแถวคือ 1 Pull
            Request ที่รอ merge เข้า <code>data/apps/</code> ตอนนี้ยังเป็นโหมดทดสอบในเครื่องนี้เท่านั้น
          </p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}

          {data && queue && (
            <QueueList
              queue={queue}
              developers={data.developers}
              categories={data.categories}
              onChanged={refresh}
            />
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function QueueList({ queue, developers, categories, onChanged }) {
  if (queue.length === 0) {
    return <StateMessage kind="empty">ไม่มีแอปรอตรวจตอนนี้ 🎉</StateMessage>;
  }

  return (
    <ul className="queue-list">
      {queue.map((draft) => (
        <QueueItem
          key={draft.id}
          draft={draft}
          developer={developers.find((d) => d.id === draft.developer_id)}
          categories={categories.filter((c) => draft.category_ids?.includes(c.id))}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}

function QueueItem({ draft, developer, categories, onChanged }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const primaryMethod = draft.install_methods?.find((m) => m.primary) || draft.install_methods?.[0];

  function approve() {
    approveMockSubmission(draft);
    onChanged();
  }

  function confirmReject() {
    if (reason.trim().length < 3) {
      setError("กรอกเหตุผลอย่างน้อย 3 ตัวอักษร (developer จะเห็นข้อความนี้)");
      return;
    }
    rejectMockSubmission(draft, reason);
    onChanged();
  }

  return (
    <li className="queue-item">
      <div className="queue-item__head">
        <AppIcon app={draft} size={48} />
        <div className="queue-item__title">
          <h3>{draft.name}</h3>
          <p className="queue-item__meta mono">
            {draft.id} · ส่งโดย {developer?.name || draft.developer_id} · {formatDate(draft.created_at)}
          </p>
        </div>
      </div>

      <p className="queue-item__desc">{draft.description_short}</p>

      <dl className="queue-item__facts">
        <div>
          <dt>หมวดหมู่</dt>
          <dd>{categories.map((c) => c.name).join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>{draft.license}</dd>
        </div>
        <div>
          <dt>ติดตั้งผ่าน</dt>
          <dd>
            {primaryMethod ? (
              <a href={primaryMethod.url} target="_blank" rel="noreferrer">
                {primaryMethod.type.toUpperCase()} — ตรวจลิงก์
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>ขนาดไฟล์</dt>
          <dd>{formatSize(draft.size_mb)}</dd>
        </div>
      </dl>

      {!rejecting ? (
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={approve}>
            ✅ อนุมัติ
          </button>
          <button type="button" className="btn-danger" onClick={() => setRejecting(true)}>
            ✕ ปฏิเสธ
          </button>
          {developer && (
            <Link href={`/developer/${developer.id}`} className="btn-secondary btn-small">
              ดูโปรไฟล์นักพัฒนา
            </Link>
          )}
        </div>
      ) : (
        <div className="reject-box">
          <label className="form-field">
            <span className="form-field__label">เหตุผลที่ปฏิเสธ (จะโชว์ให้ developer เห็น)</span>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="เช่น ลิงก์ APK เข้าไม่ได้ / คำอธิบายไม่ตรงกับแอปจริง"
            />
            {error && <span className="field-error">{error}</span>}
          </label>
          <div className="form-actions">
            <button type="button" className="btn-danger" onClick={confirmReject}>
              ยืนยันปฏิเสธ
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError("");
              }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
