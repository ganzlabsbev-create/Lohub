import Link from "next/link";
import AppIcon from "./AppIcon";

const METHOD_META = {
  apk: { label: "APK", dot: "#3FA34D" },
  github: { label: "GitHub", dot: "#2C2C2C" },
  pwa: { label: "Web App", dot: "#2C5FA8" },
};

export default function AppCard({ app, categories }) {
  const cats = (app.category_ids || [])
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean);
  const accentColor = cats[0]?.color || "#A9A38C";
  const primaryMethod =
    app.install_methods.find((m) => m.primary) || app.install_methods[0];
  const meta = METHOD_META[primaryMethod?.type] || { label: primaryMethod?.type, dot: "#999" };

  return (
    <Link href={`/app/${app.slug}`} className="app-card">
      <div className="app-card__top">
        <AppIcon app={app} accentColor={accentColor} />
        <div className="app-card__title">
          <h3>{app.name}</h3>
          <p className="app-card__dev">{app.developer_name}</p>
        </div>
        {app.verified && <span className="stamp" title="ยืนยันตัวตนแล้ว">✓ verified</span>}
      </div>

      <p className="app-card__desc">{app.description_short}</p>

      <div className="app-card__tags">
        {cats.map((c) => (
          <span key={c.id} className="tag" style={{ "--pill-color": c.color }}>
            {c.icon} {c.name}
          </span>
        ))}
      </div>

      <div className="app-card__ticket">
        <span className="app-card__method">
          <i className="dot" style={{ background: meta.dot }} />
          {meta.label}
        </span>
        <span className="app-card__perf" aria-hidden="true" />
        <span className="app-card__meta mono">
          v{app.current_version} · {app.size_mb > 0 ? `${app.size_mb} MB` : "เว็บแอป"}
        </span>
      </div>
    </Link>
  );
}
