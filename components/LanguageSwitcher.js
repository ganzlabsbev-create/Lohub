import { useI18n } from "../lib/i18n";

// ตัวสลับภาษาแบบเรียบง่าย — ปุ่มคู่ TH/EN สลับ context ทันที ไม่มีการ reload หน้า
// ใช้ใน SideDrawer (เมนูหลัก) และหน้า /account/settings
export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, t, languages } = useI18n();

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t("language.label")}>
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn${lang === code ? " lang-switch__btn--active" : ""}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  );
}
