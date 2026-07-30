import { useEffect, useState } from "react";

// โหลด public/search-index.json จุดเดียว — ใช้ร่วมกันทุกหน้า (หน้าแรก, หน้าหมวด, ค้นหา, รายละเอียด)
export function useSearchIndex() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
