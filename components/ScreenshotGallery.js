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

function normalizeShot(shot, index) {
  // Support plain string paths, e.g. "/assets/screenshots/app_0001-01.png"
  if (typeof shot === "string") {
    return { id: `shot-${index}`, order: index, url: shot, caption: "" };
  }
  // Support object entries, filling in sensible defaults for missing fields
  return {
    id: shot.id ?? `shot-${index}`,
    order: shot.order ?? index,
    url: shot.url ?? shot.path ?? "",
    caption: shot.caption ?? "",
  };
}

export default function ScreenshotGallery({ screenshots }) {
  const { t } = useTranslation();
  if (!screenshots || screenshots.length === 0) return null;
  const sorted = screenshots
    .map(normalizeShot)
    .sort((a, b) => a.order - b.order);

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
