import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const STATUS_OPTIONS = ["open", "reviewed", "resolved"];

export default function AdminReportsPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, reports: null });
  const { t } = useTranslation();
  const statusLabel = { open: t("adminReports.statusOpen"), reviewed: t("adminReports.statusReviewed"), resolved: t("adminReports.statusResolved") };
  const typeLabel = { bug: t("adminReports.typeBug"), content: t("adminReports.typeContent"), other: t("adminReports.typeOther") };

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
            <h1>{t("adminReports.title")}</h1>
          </div>
          <p className="banner-note">{t("adminReports.note")}</p>

          {loading && <StateMessage kind="loading">{t("adminReports.loading")}</StateMessage>}
          {error && <StateMessage kind="error">{t("adminReports.loadError", { error })}</StateMessage>}
          {reports && reports.length === 0 && <StateMessage kind="empty">{t("adminReports.noReports")}</StateMessage>}

          {reports && reports.length > 0 && (
            <ul className="dev-list">
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} onChanged={load} statusLabel={statusLabel} typeLabel={typeLabel} />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function ReportRow({ report, onChanged, statusLabel, typeLabel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

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
        <p className="dev-row__name">{typeLabel[report.type] || report.type || t("adminReports.typeOther")}</p>
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
              {statusLabel[s]}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
