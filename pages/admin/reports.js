import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// สถานะที่ dev เจ้าของแอปเป็นคนเปลี่ยน (ดู /dev/apps/[id]/inbox) — หน้านี้แสดงผลอย่างเดียว
const STATUS_LABEL_KEY = {
  open: "adminReports.statusOpen",
  replied: "adminReports.statusReplied",
  resolved: "adminReports.statusResolved",
  closed: "adminReports.statusClosed",
};

export default function AdminReportsPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, reports: null });
  const { t } = useTranslation();
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
          <p className="banner-note">{t("adminReports.readOnlyNote")}</p>

          {loading && <StateMessage kind="loading">{t("adminReports.loading")}</StateMessage>}
          {error && <StateMessage kind="error">{t("adminReports.loadError", { error })}</StateMessage>}
          {reports && reports.length === 0 && <StateMessage kind="empty">{t("adminReports.noReports")}</StateMessage>}

          {reports && reports.length > 0 && (
            <ul className="dev-list">
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} typeLabel={typeLabel} />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function ReportRow({ report, typeLabel }) {
  const [showThread, setShowThread] = useState(false);
  const { t } = useTranslation();
  const statusLabel = report.status && STATUS_LABEL_KEY[report.status] ? t(STATUS_LABEL_KEY[report.status]) : report.status;

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">{typeLabel[report.type] || report.type || t("adminReports.typeOther")}</p>
        <p className="dev-row__meta mono">
          {report.app_id} · @{report.github_username} · {formatDate(report.created_at)}
        </p>
        {report.message && <p className="dev-row__text">{report.message}</p>}

        {report.replies && report.replies.length > 0 && (
          <>
            <button type="button" className="link-button" onClick={() => setShowThread((v) => !v)}>
              {showThread ? t("adminReports.hideThread") : t("adminReports.showThread", { count: report.replies.length })}
            </button>
            {showThread && (
              <ul className="dev-row__thread">
                {report.replies.map((rep) => (
                  <li key={rep.id} className="dev-row__thread-item">
                    <strong>{rep.author_role === "developer" ? t("adminReports.fromDeveloper") : t("adminReports.fromReporter")} @{rep.author_username}</strong>{" "}
                    <span className="mono">{formatDate(rep.created_at)}</span>
                    <p>{rep.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <div className="dev-row__actions">
        <span className="badge">{statusLabel}</span>
      </div>
    </li>
  );
}
