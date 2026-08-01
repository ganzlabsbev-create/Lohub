import { useState } from "react";
import { IconImage } from "./Icons";
import { useTranslation } from "../lib/i18n";

function Shot({ shot }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="shot shot--fallback" aria-hidden="true">
        <IconImage size={28} />
        {shot.caption && <p>{shot.caption}</p>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shot.url}
      alt={shot.caption || ""}
      className="shot"
      onError={() => setBroken(true)}
    />
  );
}

export default function ScreenshotGallery({ screenshots }) {
  const { t } = useTranslation();
  if (!screenshots || screenshots.length === 0) return null;
  const sorted = [...screenshots].sort((a, b) => a.order - b.order);

  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("screenshotGallery.title")}</h2>
      </div>
      <div className="shot-row">
        {sorted.map((shot) => (
          <Shot key={shot.id} shot={shot} />
        ))}
      </div>
    </section>
  );
}
