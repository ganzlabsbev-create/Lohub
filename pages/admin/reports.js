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

const STATUS_OPTIONS = ["open", "reviewed", "resolved"];
const STATUS_LABEL = { open: "เปิดอยู่", reviewed: "ตรวจแล้ว", resolved: "แก้ไขแล้ว" };
const TYPE_LABEL = { bug: "แอปมีปัญหา", content: "ข้อมูลไม่ถูกต้อง", other: "อื่นๆ" };

export default function AdminReportsPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, reports: null });

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/reports")
      .then((data) => setState({ loading: false, error: null, reports: data.reports || [] }))
      .catch((err) => setState({ loading: false, error: err.message, reports: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, reports } = state;

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="reports" />
          <div className="section__head">
            <h1>รายงานปัญหา</h1>
          </div>
          <p className="banner-note">รายงานปัญหาที่ผู้ใช้แจ้งเข้ามา — เปลี่ยนสถานะได้ที่นี่</p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}
          {reports && reports.length === 0 && <StateMessage kind="empty">ยังไม่มีรายงานปัญหา</StateMessage>}

          {reports && reports.length > 0 && (
            <ul className="dev-list">
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} onChanged={load} />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function ReportRow({ report, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeStatus(e) {
    const status = e.target.value;
    setBusy(true);
    setError("");
    apiPost("/api/admin/reports", { report_id: report.id, status })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">{TYPE_LABEL[report.type] || report.type || "อื่นๆ"}</p>
        <p className="dev-row__meta mono">
          {report.app_id} · @{report.username} · {formatDate(report.created_at)}
        </p>
        {report.message && <p className="dev-row__text">{report.message}</p>}
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="dev-row__actions">
        <select value={report.status} onChange={changeStatus} disabled={busy}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
