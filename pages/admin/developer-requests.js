import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

export default function AdminDeveloperRequestsPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, requests: null });

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/developer-requests")
      .then((data) => setState({ loading: false, error: null, requests: data.requests || [] }))
      .catch((err) => setState({ loading: false, error: err.message, requests: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, requests } = state;
  const pending = requests?.filter((r) => r.status === "pending") || [];
  const done = requests?.filter((r) => r.status !== "pending") || [];

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="developer-requests" />
          <div className="section__head">
            <h1>คำขอเป็น Developer</h1>
          </div>
          <p className="banner-note">
            อนุมัติแล้วระบบจะยกระดับ role เป็น developer ให้อัตโนมัติ พร้อมเปิด Pull Request สร้างไฟล์{" "}
            <code>data/developers/{"{id}"}.json</code> ให้เองด้วย — ต้องกด merge PR นั้นอีกทีถึงจะขึ้นเว็บจริง
            (จุดตรวจสอบสุดท้ายก่อน publish)
          </p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}

          {requests && (
            <>
              {pending.length === 0 ? (
                <StateMessage kind="empty">ไม่มีคำขอรอตรวจตอนนี้</StateMessage>
              ) : (
                <ul className="dev-list">
                  {pending.map((r) => (
                    <PendingRow key={r.id} request={r} onChanged={load} />
                  ))}
                </ul>
              )}

              {done.length > 0 && (
                <div className="section" style={{ marginTop: 28 }}>
                  <div className="section__head">
                    <h2>ประวัติคำขอ</h2>
                  </div>
                  <ul className="dev-list">
                    {done.map((r) => (
                      <li key={r.id} className="dev-row">
                        <div className="dev-row__body">
                          <p className="dev-row__name">
                            @{r.username}
                            <span
                              className={`badge ${r.status === "approved" ? "badge--published" : "badge--rejected"}`}
                            >
                              {r.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                            </span>
                          </p>
                          <p className="dev-row__meta mono">
                            {formatDate(r.created_at)}
                            {r.admin_note ? ` · หมายเหตุ: ${r.admin_note}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function PendingRow({ request, onChanged }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [github, setGithub] = useState(null);

  function decide(status) {
    setBusy(true);
    setError("");
    setGithub(null);
    apiPost("/api/admin/developer-requests", {
      request_id: request.id,
      status,
      admin_note: note,
      // ส่งรายละเอียดที่กรอกไว้ทั้งหมดไปด้วย — ใช้สร้างไฟล์ data/developers/{id}.json อัตโนมัติตอน approve
      username: request.username,
      reason: request.reason,
      portfolio_url: request.portfolio_url,
      display_name: request.display_name,
      website: request.website,
      contact: request.contact,
    })
      .then((data) => {
        if (data.github) setGithub(data.github);
        if (!data.github || data.github.ok) onChanged();
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">@{request.username}</p>
        <p className="dev-row__meta mono">ส่งเมื่อ {formatDate(request.created_at)}</p>
        {request.reason && <p className="dev-row__text">{request.reason}</p>}
        {request.portfolio_url && (
          <p className="dev-row__text">
            <a href={request.portfolio_url} target="_blank" rel="noreferrer">
              ดูผลงาน
            </a>
          </p>
        )}
        {request.website && <p className="dev-row__text">เว็บไซต์: {request.website}</p>}
        {request.contact && <p className="dev-row__text">ติดต่อ: {request.contact}</p>}
        <label className="form-field">
          <span className="form-field__label">หมายเหตุถึงผู้สมัคร (ถ้ามี)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <span className="field-error">{error}</span>}
        {github?.ok && (
          <p className="banner-note banner-note--ok">
            อนุมัติแล้ว และสร้างไฟล์ให้เรียบร้อย —{" "}
            <a href={github.pr_url} target="_blank" rel="noreferrer">
              เปิด Pull Request #{github.pr_number} เพื่อกด merge
            </a>
          </p>
        )}
        {github && !github.ok && (
          <p className="banner-note">
            role เปลี่ยนเป็น developer แล้ว แต่สร้างไฟล์/PR อัตโนมัติไม่สำเร็จ: {github.error} —
            ลองกด "อนุมัติ" ซ้ำอีกครั้ง หรือเพิ่มไฟล์ <code>data/developers/{"{id}"}.json</code> เองผ่าน GitHub
          </p>
        )}
      </div>
      <div className="dev-row__actions">
        <button type="button" className="btn-primary btn-small" onClick={() => decide("approved")} disabled={busy}>
          อนุมัติ
        </button>
        <button type="button" className="btn-danger btn-small" onClick={() => decide("rejected")} disabled={busy}>
          ปฏิเสธ
        </button>
      </div>
    </li>
  );
}
