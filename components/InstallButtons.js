import { IconDownload, IconCode, IconExternal } from "./Icons";
import { useTranslation } from "../lib/i18n";

const METHOD_META = {
  apk: { labelKey: "installButtons.apk", Icon: IconDownload },
  github: { labelKey: "installButtons.github", Icon: IconCode },
  pwa: { labelKey: "installButtons.pwa", Icon: IconExternal },
};

export default function InstallButtons({ methods }) {
  const { t } = useTranslation();
  if (!methods || methods.length === 0) return null;
  // primary มาก่อนเสมอ ตามสเปก
  const sorted = [...methods].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));

  return (
    <div className="install-row">
      {sorted.map((m, i) => {
        const meta = METHOD_META[m.type] || { labelKey: null, Icon: IconExternal };
        const Icon = meta.Icon;
        const fallbackLabel = meta.labelKey ? t(meta.labelKey) : m.label;
        return (
          <a
            key={`${m.type}-${i}`}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`install-btn${m.primary ? " install-btn--primary" : ""}`}
          >
            <Icon size={16} />
            {m.label || fallbackLabel}
          </a>
        );
      })}
    </div>
  );
}
