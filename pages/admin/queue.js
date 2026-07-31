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
import { apiGet, apiPatch } from "../../lib/apiClient";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: หน้านี้จำกัดเฉพาะบัญชีที่อยู่ใน admin_github_usernames (ดู AdminGuard)
//
// เดิมหน้านี้อ่าน/เขียนผ่าน lib/mockAdmin.js (localStorage mock) ซึ่งเป็นคนละระบบกับแอปที่ merge
// เข้ามาจริงผ่าน PR เลยไม่เคยเห็นแอปที่ส่งจริงๆ เลย ตอนนี้แก้เป็นของจริง 2 ขั้นตอนต่อกัน:
//   1) PR ที่ /dev/submit เปิดไว้ (ยังไม่ merge) — กด "ผสาน (merge)" ตรงนี้ได้เลย ไม่ต้องไป GitHub
//   2) หลัง merge, workflow convert-submissions.yml จะสร้าง data/apps/{id}.json (status: pending)
//      ให้อัตโนมัติ (รอสักครู่) แล้วมาโผล่ในคิวรอตรวจด้านล่าง กด "อนุมัติ" เพื่อ publish ขึ้นเว็บจริง
export default function AdminQueuePage({ site }) {
  const { loading: siteLoading, error: siteError, data } = useSearchIndex();
  const [prState, setPrState] = useState({ loading: true, error: null, prs: null });
  const [appState, setAppState] = useState({ loading: true, error: null, apps: null });

  function loadPRs() {
    setPrState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/apps/submission-prs")
      .then((res) => setPrState({ loading: false, error: null, prs: res.prs || [] }))
      .catch((err) => setPrState({ loading: false, error: err.message, prs: null }));
  }

  function loadApps() {
    setAppState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/apps/pending")
      .then((res) => setAppState({ loading: false, error: null, apps: res.apps || [] }))
      .catch((err) => setAppState({ loading: false, error: err.message, apps: null }));
  }

  useEffect(() => {
    loadPRs();
    loadApps();
  }, []);

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="queue" />
          <div className="section__head">
            <h1>คิวรอตรวจ</h1>
          </div>

          <h2 style={{ marginTop: 4 }}>PR รอ merge</h2>
          <p className="banner-note">
            แอปที่ developer เพิ่งส่งผ่านฟอร์ม — ยังไม่เข้า main ต้อง merge ก่อนถึงจะมีไฟล์แอปจริง
          </p>
          {prState.loading && <StateMessage kind="loading">กำลังโหลด PR...</StateMessage>}
          {prState.error && <StateMessage kind="error">โหลด PR ไม่สำเร็จ: {prState.error}</StateMessage>}
          {prState.prs && <PRList prs={prState.prs} onChanged={() => { loadPRs(); loadApps(); }} />}

          <h2 style={{ marginTop: 32 }}>แอปรอ publish</h2>
          <p className="banner-note">
            แอปที่ merge เข้า main แล้ว (มีไฟล์ใน <code>data/apps/</code> จริง) แต่ยังไม่ขึ้นเว็บ — กด
            &quot;อนุมัติ&quot; เพื่อเผยแพร่ หรือ &quot;ปฏิเสธ&quot; เพื่อตีกลับ
          </p>
          {(appState.loading || siteLoading) && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {(appState.error || siteError) && (
            <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {appState.error || siteError}</StateMessage>
          )}
          {data && appState.apps && (
            <QueueList
              queue={appState.apps}
              developers={data.developers}
              categories={data.categories}
              onChanged={loadApps}
            />
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function PRList({ prs, onChanged }) {
  if (prs.length === 0) {
    return <StateMessage kind="empty">ไม่มี PR ส่งแอปใหม่ค้างอยู่</StateMessage>;
  }
  return (
    <ul className="dev-list">
      {prs.map((pr) => (
        <PRRow key={pr.number} pr={pr} onChanged={onChanged} />
      ))}
    </ul>
  );
}

function PRRow({ pr, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function merge() {
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/submission-prs/${pr.number}`, { action: "merge" })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">{pr.title}</p>
        <p className="dev-row__meta mono">
          #{pr.number} · @{pr.author} · {formatDate(pr.created_at)}
        </p>
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="dev-row__actions">
        <a href={pr.html_url} target="_blank" rel="noreferrer" className="btn-secondary btn-small">
          ดู diff บน GitHub
        </a>
        <button type="button" className="btn-primary btn-small" onClick={merge} disabled={busy}>
          🔀 ผสาน (merge)
        </button>
      </div>
    </li>
  );
}

function QueueList({ queue, developers, categories, onChanged }) {
  if (queue.length === 0) {
    return <StateMessage kind="empty">ไม่มีแอปรอ publish ตอนนี้ 🎉</StateMessage>;
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
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const primaryMethod = draft.install_methods?.find((m) => m.primary) || draft.install_methods?.[0];

  function approve() {
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/${draft.id}`, { action: "approve" })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  function confirmReject() {
    if (reason.trim().length < 3) {
      setError("กรอกเหตุผลอย่างน้อย 3 ตัวอักษร (developer จะเห็นข้อความนี้)");
      return;
    }
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/${draft.id}`, { action: "reject", reason })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
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

      {error && <p className="field-error">{error}</p>}

      {!rejecting ? (
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={approve} disabled={busy}>
            ✅ อนุมัติ
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => setRejecting(true)}
            disabled={busy}
          >
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
          </label>
          <div className="form-actions">
            <button type="button" className="btn-danger" onClick={confirmReject} disabled={busy}>
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
              disabled={busy}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
