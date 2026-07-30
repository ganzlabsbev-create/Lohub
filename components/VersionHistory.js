import { formatDate } from "../lib/format";

export default function VersionHistory({ versions, currentVersion }) {
  if (!versions || versions.length === 0) return null;

  return (
    <section className="section">
      <div className="section__head">
        <h2>ประวัติเวอร์ชัน</h2>
      </div>
      <ul className="version-list">
        {versions.map((v) => (
          <li key={v.version} className="version-item">
            <div className="version-item__head">
              <span className="mono version-item__num">
                v{v.version}
                {v.version === currentVersion && <span className="tag-current">ปัจจุบัน</span>}
              </span>
              <span className="version-item__date">{formatDate(v.date)}</span>
            </div>
            {v.note && <p className="version-item__note">{v.note}</p>}
            {v.apk_url && (
              <a href={v.apk_url} target="_blank" rel="noopener noreferrer" className="version-item__link">
                ดาวน์โหลดเวอร์ชันนี้
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
