import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const ROLE_LABEL = { member: "สมาชิก", developer: "นักพัฒนา", admin: "แอดมิน" };

export default function AdminMembersPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, members: null });

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/members")
      .then((data) => setState({ loading: false, error: null, members: data.members || [] }))
      .catch((err) => setState({ loading: false, error: err.message, members: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, members } = state;

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="members" />
          <div className="section__head">
            <h1>จัดการสมาชิก</h1>
          </div>
          <p className="banner-note">
            รายชื่อสมาชิกทั้งหมดที่เคย login เข้าระบบ — ให้/ถอน verified badge ได้ที่นี่
          </p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}
          {members && members.length === 0 && <StateMessage kind="empty">ยังไม่มีสมาชิก</StateMessage>}

          {members && members.length > 0 && (
            <ul className="dev-list">
              {members.map((m) => (
                <MemberRow key={m.username} member={m} onChanged={load} />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function MemberRow({ member, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleVerified() {
    setBusy(true);
    setError("");
    apiPost("/api/admin/members", { username: member.username, verified: !member.verified })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">
          {member.display_name || member.username}
          {member.verified && (
            <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">
              ✓ verified
            </span>
          )}
        </p>
        <p className="dev-row__meta mono">
          @{member.username} · {ROLE_LABEL[member.role] || member.role}
        </p>
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="dev-row__actions">
        <button
          type="button"
          className={member.verified ? "btn-danger btn-small" : "btn-primary btn-small"}
          onClick={toggleVerified}
          disabled={busy}
        >
          {busy ? "กำลังบันทึก..." : member.verified ? "ถอน verified" : "ให้ verified"}
        </button>
      </div>
    </li>
  );
}
