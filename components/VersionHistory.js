import { formatDate } from "../lib/format";
import { useTranslation } from "../lib/i18n";

export default function VersionHistory({ versions, currentVersion }) {
  const { t } = useTranslation();
  if (!versions || versions.length === 0) return null;

  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("versionHistory.title")}</h2>
      </div>
      <ul className="version-list">
        {versions.map((v) => (
          <li key={v.version} className="version-item">
            <div className="version-item__head">
              <span className="mono version-item__num">
                v{v.version}
                {v.version === currentVersion && <span className="tag-current">{t("common.current")}</span>}
              </span>
              <span className="version-item__date">{formatDate(v.date)}</span>
            </div>
            {v.note && <p className="version-item__note">{v.note}</p>}
            {v.apk_url && (
              <a href={v.apk_url} target="_blank" rel="noopener noreferrer" className="version-item__link">
                {t("versionHistory.downloadThisVersion")}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
