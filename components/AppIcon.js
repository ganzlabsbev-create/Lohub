import { useState } from "react";

// ไอคอนแอป — ถ้าโหลดรูปไม่ได้ (ยังไม่มีไฟล์จริงใน assets/icons) จะ fallback เป็นตัวอักษรแรกของชื่อ
export default function AppIcon({ app, accentColor, size = 56 }) {
  const [broken, setBroken] = useState(false);
  const initial = app.name?.trim()?.[0]?.toUpperCase() || "?";
  const src = app.icon?.path || app.icon?.url;

  if (broken || !src) {
    return (
      <div
        className="app-icon app-icon--fallback"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="app-icon"
      width={size}
      height={size}
      onError={() => setBroken(true)}
    />
  );
}
