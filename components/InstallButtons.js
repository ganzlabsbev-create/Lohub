import { IconDownload, IconCode, IconExternal } from "./Icons";

const METHOD_META = {
  apk: { label: "ดาวน์โหลด APK", Icon: IconDownload },
  github: { label: "เปิดใน GitHub", Icon: IconCode },
  pwa: { label: "เปิดเว็บแอป", Icon: IconExternal },
};

export default function InstallButtons({ methods }) {
  if (!methods || methods.length === 0) return null;
  // primary มาก่อนเสมอ ตามสเปก
  const sorted = [...methods].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));

  return (
    <div className="install-row">
      {sorted.map((m, i) => {
        const meta = METHOD_META[m.type] || { label: m.label, Icon: IconExternal };
        const Icon = meta.Icon;
        return (
          <a
            key={`${m.type}-${i}`}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`install-btn${m.primary ? " install-btn--primary" : ""}`}
          >
            <Icon size={16} />
            {m.label || meta.label}
          </a>
        );
      })}
    </div>
  );
}
