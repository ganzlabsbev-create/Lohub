import { useState } from "react";

// อวตารนักพัฒนา — ถ้าโหลดรูปไม่ได้ fallback เป็นตัวอักษรแรกของชื่อ (แพทเทิร์นเดียวกับ AppIcon.js)
export default function DevAvatar({ developer, size = 72 }) {
  const [broken, setBroken] = useState(false);
  const initial = developer.name?.trim()?.[0]?.toUpperCase() || "?";
  const src = developer.avatar;

  if (broken || !src) {
    return (
      <div
        className="dev-avatar dev-avatar--fallback"
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
      className="dev-avatar"
      width={size}
      height={size}
      onError={() => setBroken(true)}
    />
  );
}
