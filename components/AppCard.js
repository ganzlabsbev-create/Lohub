import Link from "next/link";
import AppIcon from "./AppIcon";
import { IconCheck } from "./Icons";
import { useTranslation } from "../lib/i18n";

// การ์ดแบบ app store จริง — โชว์แค่สิ่งที่ตัดสินใจได้ภายใน 2-3 วิ: ไอคอน ชื่อ นักพัฒนา (+ verified ถ้ามี)
// รายละเอียดอื่น (เวอร์ชัน/ขนาด/หมวดหมู่/วิธีติดตั้ง) ย้ายไปอยู่หน้ารายละเอียดแอปแทน ไม่ยัดไว้ที่การ์ด
export default function AppCard({ app, categories }) {
  const { t } = useTranslation();
  return (
    <Link href={`/app/${app.slug}`} className="app-card">
      <AppIcon app={app} size={64} />
      <div className="app-card__title">
        <h3>{app.name}</h3>
        <p className="app-card__dev">
          {app.developer_name}
          {app.verified && (
            <span className="app-card__verified" title={t("common.verified")}>
              <IconCheck size={12} />
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
