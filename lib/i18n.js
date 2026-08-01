import { createContext, useContext, useEffect, useMemo, useState } from "react";
import th from "../data/i18n/th.json";
import en from "../data/i18n/en.json";

// ระบบ 2 ภาษา (th/en) — Provider นี้ครอบทั้งแอปใน pages/_app.js
// ค่า default = "th" ตามที่กำหนดใน data/settings/site.json (default_language)
// ภาษาที่ผู้ใช้เลือกจะถูกจำไว้ใน localStorage คีย์ "lohub_lang" เพื่อให้จำได้ข้ามการเข้าชม
const DICTIONARIES = { th, en };
const STORAGE_KEY = "lohub_lang";
const DEFAULT_LANGUAGE = "th";

const I18nContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key) => key,
});

function getByPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, name) => (vars[name] !== undefined ? vars[name] : match));
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && DICTIONARIES[saved]) setLangState(saved);
    } catch {
      // localStorage อาจใช้ไม่ได้ (private mode ฯลฯ) — ปล่อยให้ใช้ default ต่อไป
    }
  }, []);

  function setLang(next) {
    if (!DICTIONARIES[next]) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ไม่เป็นไรถ้าเซฟไม่ได้ — แค่ไม่จำข้ามเซสชัน
    }
  }

  const t = useMemo(() => {
    return (key, vars) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LANGUAGE];
      const fallbackDict = DICTIONARIES[DEFAULT_LANGUAGE];
      const value = getByPath(dict, key) ?? getByPath(fallbackDict, key) ?? key;
      return typeof value === "string" ? interpolate(value, vars) : value;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, languages: Object.keys(DICTIONARIES) }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// helper แบบสั้น เผื่ออยาก destructure แค่ t
export function useTranslation() {
  const { t, lang, setLang, languages } = useI18n();
  return { t, lang, setLang, languages };
}
