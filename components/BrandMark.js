import { useState } from "react";

// โลโก้แบรนด์ Lohub — แยกอิสระจากชุดไอคอน Lucide ตามสเปก (ข้อ 2)
// คาดว่าไฟล์โลโก้จริงจะถูกวางไว้ที่ public/brand/lohub-logo.svg (ผู้ใช้จะใส่เอง)
// ถ้ายังไม่มีไฟล์ (หรือโหลดไม่ได้) จะ fallback เป็นตัวอักษร ▣ แบบเดิมโดยอัตโนมัติ
export default function BrandMark({ size = 22, className = "" }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className={`masthead__mark ${className}`} aria-hidden="true">
        ▣
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/lohub-logo.svg"
      alt=""
      width={size}
      height={size}
      className={`masthead__mark masthead__mark--logo ${className}`}
      onError={() => setBroken(true)}
    />
  );
}
