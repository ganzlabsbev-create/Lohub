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

export default function AdminReviewsPage({ site }) {
  const [state, setState] = useState({ loading: true, error: null, reviews: null });
  const { t } = useTranslation();

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/reviews")
      .then((data) => setState({ loading: false, error: null, reviews: data.reviews || [] }))
      .catch((err) => setState({ loading: false, error: err.message, reviews: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, reviews } = state;

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="reviews" />
          <div className="section__head">
            <h1>{t("adminReviews.title")}</h1>
          </div>
          <p className="banner-note">{t("adminReviews.note")}</p>

          {loading && <StateMessage kind="loading">{t("adminReviews.loading")}</StateMessage>}
          {error && <StateMessage kind="error">{t("adminReviews.loadError", { error })}</StateMessage>}
          {reviews && reviews.length === 0 && <StateMessage kind="empty">{t("adminReviews.noReviews")}</StateMessage>}

          {reviews && reviews.length > 0 && (
            <ul className="dev-list">
              {reviews.map((r) => (
                <ReviewRow key={r.id} review={r} onChanged={load} />
              ))}
            </ul>
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function ReviewRow({ review, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hidden = review.status === "hidden";
  const { t } = useTranslation();

  function act(action) {
    if (action === "delete" && !window.confirm(t("adminReviews.confirmDelete"))) return;
    setBusy(true);
    setError("");
    apiPost("/api/admin/reviews", { review_id: review.id, action })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">
          <span className="mono">
            {"★".repeat(review.rating || 0)}
            {"☆".repeat(5 - (review.rating || 0))}
          </span>
          <span className={`badge ${hidden ? "badge--rejected" : "badge--published"}`}>
            {hidden ? t("adminReviews.hidden") : t("adminReviews.visible")}
          </span>
        </p>
        <p className="dev-row__meta mono">
          {review.app_id} · @{review.username} · {formatDate(review.created_at)}
        </p>
        {review.comment && <p className="dev-row__text">{review.comment}</p>}
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="dev-row__actions">
        <button
          type="button"
          className="btn-secondary btn-small"
          onClick={() => act(hidden ? "unhide" : "hide")}
          disabled={busy}
        >
          {hidden ? t("adminReviews.unhide") : t("adminReviews.hide")}
        </button>
        <button type="button" className="btn-danger btn-small" onClick={() => act("delete")} disabled={busy}>
          {t("adminReviews.delete")}
        </button>
      </div>
    </li>
  );
}
