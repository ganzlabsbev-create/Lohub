import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const ROLE_LABEL = { member: "สมาชิก", developer: "นักพัฒนา", admin: "แอดมิน" };

// หน้าโปรไฟล์ผู้ใช้ที่ login แล้ว ใช้ร่วมกันทุก role (member/developer/admin)
// role/ข้อมูลจริงเชื่อจาก GET /api/profile เป็นหลัก ไม่คำนวณ role เองซ้ำฝั่ง client
export default function AccountPage({ site }) {
  const { data: session, status } = useSession();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>บัญชีของฉัน</h1>
        </div>

        {status === "loading" && (
          <StateMessage kind="loading">กำลังตรวจสอบสถานะเข้าสู่ระบบ...</StateMessage>
        )}

        {status !== "loading" && !session && (
          <StateMessage kind="empty">
            เข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ —{" "}
            <button type="button" className="link-button" onClick={() => signIn("github")}>
              เข้าสู่ระบบด้วย GitHub
            </button>
          </StateMessage>
        )}

        {session && <ProfilePanel />}
      </section>
    </Layout>
  );
}

function ProfilePanel() {
  const [state, setState] = useState({ loading: true, error: null, profile: null });

  useEffect(() => {
    apiGet("/api/profile")
      .then((data) => setState({ loading: false, error: null, profile: data }))
      .catch((err) => setState({ loading: false, error: err.message, profile: null }));
  }, []);

  const { loading, error, profile } = state;

  if (loading) return <StateMessage kind="loading">กำลังโหลดโปรไฟล์...</StateMessage>;
  if (error) return <StateMessage kind="error">โหลดโปรไฟล์ไม่สำเร็จ: {error}</StateMessage>;
  if (!profile) return null;

  const { username, role, profile: memberRow } = profile;
  const displayName = memberRow?.display_name || username;
  const avatar = memberRow?.avatar_url;
  const verified = !!memberRow?.verified;

  return (
    <>
      <div className="account-head">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="dev-avatar" width={72} height={72} />
        ) : (
          <div className="dev-avatar dev-avatar--fallback" style={{ width: 72, height: 72 }} aria-hidden="true">
            {displayName?.trim()?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="account-name">
            {displayName}
            {verified && (
              <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">
                ✓ verified
              </span>
            )}
          </p>
          <p className="account-role mono">
            @{username} · {ROLE_LABEL[role] || role}
          </p>
        </div>
      </div>

      {role === "member" && <DeveloperRequestPanel />}

      {role === "developer" && (
        <p className="banner-note">
          บัญชีนี้เป็นนักพัฒนาแล้ว — ไปที่ <Link href="/dev/dashboard">Dashboard นักพัฒนา</Link>{" "}
          เพื่อจัดการแอปของคุณ
        </p>
      )}
    </>
  );
}

// สมัครเป็น Developer (เฉพาะ role === "member") — โชว์ฟอร์มถ้ายังไม่มีคำขอ/ถูกปฏิเสธ,
// ถ้ามีคำขอ pending อยู่แล้ว ให้ซ่อนฟอร์มแล้วโชว์สถานะรอตรวจแทนตามที่ระบุไว้
function DeveloperRequestPanel() {
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [form, setForm] = useState({ reason: "", portfolio_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function loadRequest() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/developer-requests")
      .then((data) => setState({ loading: false, error: null, request: data.request }))
      .catch((err) => setState({ loading: false, error: err.message, request: null }));
  }

  useEffect(() => {
    loadRequest();
  }, []);

  const { loading, error, request } = state;

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    apiPost("/api/developer-requests", form)
      .then(() => loadRequest())
      .catch((err) => setSubmitError(err.message))
      .finally(() => setSubmitting(false));
  }

  if (loading) return <StateMessage kind="loading">กำลังโหลดสถานะคำขอ...</StateMessage>;
  if (error) return <StateMessage kind="error">โหลดสถานะไม่สำเร็จ: {error}</StateMessage>;

  if (request && request.status === "pending") {
    return (
      <p className="banner-note">
        คำขอเป็น Developer ของคุณอยู่ระหว่างรอตรวจ — ส่งเมื่อ {formatDate(request.created_at)}
      </p>
    );
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>สมัครเป็น Developer</h2>
      </div>

      {request?.status === "rejected" && (
        <p className="banner-note">
          คำขอก่อนหน้าถูกปฏิเสธ{request.admin_note ? ` — เหตุผล: ${request.admin_note}` : ""} —
          แก้ไขแล้วส่งคำขอใหม่ได้ด้านล่าง
        </p>
      )}

      <form onSubmit={submit}>
        <label className="form-field">
          <span className="form-field__label">เหตุผลที่อยากเป็น Developer</span>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">ลิงก์ผลงาน (portfolio)</span>
          <input
            type="url"
            value={form.portfolio_url}
            onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        {submitError && <span className="field-error">{submitError}</span>}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "กำลังส่ง..." : "ส่งคำขอ"}
          </button>
        </div>
      </form>
    </section>
  );
}
