import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/Layout";
import StateMessage from "../../../../components/StateMessage";
import AppOwnerGuard from "../../../../components/AppOwnerGuard";
import AppIcon from "../../../../components/AppIcon";
import { getSiteSettings } from "../../../../lib/site";
import { apiGet, apiPost } from "../../../../lib/apiClient";
import { formatDate } from "../../../../lib/format";
import { useTranslation } from "../../../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จำเป็นเพราะเป็น dynamic route ที่ใช้ getStaticProps — ข้อมูลจริงโหลดฝั่ง client ทั้งหมด
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

const STATUS_OPTIONS = ["open", "replied", "resolved", "closed"];

export default function DevInboxPage({ site }) {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation();

  if (!id) return <Layout site={site} />;

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <AppOwnerGuard appId={id}>
          {(developer, app) => <InboxBody appId={id} app={app} />}
        </AppOwnerGuard>
      </section>
    </Layout>
  );
}

function InboxBody({ appId, app }) {
  const [state, setState] = useState({ loading: true, error: null, reports: null });
  const [statusFilter, setStatusFilter] = useState("");
  const { t } = useTranslation();

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    apiGet(`/api/dev/apps/${appId}/reports${qs}`)
      .then((data) => setState({ loading: false, error: null, reports: data.reports || [] }))
      .catch((err) => setState({ loading: false, error: err.message, reports: null }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, statusFilter]);

  const { loading, error, reports } = state;

  return (
    <>
      <div className="section__head">
        <AppIcon app={app} size={40} />
        <h1>{t("devInbox.title", { app: app.name })}</h1>
      </div>

      <div className="form-field" style={{ maxWidth: 220, marginBottom: 16 }}>
        <span className="form-field__label">{t("devInbox.filterLabel")}</span>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t("devInbox.filterAll")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`devInbox.status${capitalize(s)}`)}
            </option>
          ))}
        </select>
      </div>

      {loading && <StateMessage kind="loading">{t("devInbox.loading")}</StateMessage>}
      {error && <StateMessage kind="error">{t("devInbox.loadError", { error })}</StateMessage>}
      {reports && reports.length === 0 && <StateMessage kind="empty">{t("devInbox.empty")}</StateMessage>}

      {reports && reports.length > 0 && (
        <ul className="dev-list">
          {reports.map((r) => (
            <ReportThread key={r.id} appId={appId} report={r} onChanged={load} />
          ))}
        </ul>
      )}
    </>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ReportThread({ appId, report, onChanged }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  function sendReply(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    apiPost(`/api/dev/apps/${appId}/reports/${report.id}/reply`, { message })
      .then(() => {
        setMessage("");
        onChanged();
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  function changeStatus(e) {
    const status = e.target.value;
    setBusy(true);
    setError("");
    apiPost(`/api/dev/apps/${appId}/reports/${report.id}/status`, { status })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="dev-row__body">
        <p className="dev-row__meta mono">
          @{report.github_username} · {formatDate(report.created_at)}
        </p>
        <p className="dev-row__text">{report.message}</p>
      </div>

      {report.replies && report.replies.length > 0 && (
        <ul className="dev-row__thread">
          {report.replies.map((rep) => (
            <li key={rep.id} className="dev-row__thread-item">
              <strong>
                {rep.author_role === "developer" ? t("adminReports.fromDeveloper") : t("adminReports.fromReporter")} @{rep.author_username}
              </strong>{" "}
              <span className="mono">{formatDate(rep.created_at)}</span>
              <p>{rep.message}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={sendReply} className="form-actions" style={{ gap: 8 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("devInbox.replyPlaceholder")}
          style={{ flex: 1 }}
          disabled={busy}
        />
        <button type="submit" className="btn-secondary btn-small" disabled={busy || !message.trim()}>
          {t("devInbox.sendReply")}
        </button>
        <select value={report.status} onChange={changeStatus} disabled={busy}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`devInbox.status${capitalize(s)}`)}
            </option>
          ))}
        </select>
      </form>
      {error && <span className="field-error">{error}</span>}
    </li>
  );
}
