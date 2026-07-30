const STATUS_META = {
  pending: { label: "รอตรวจ", cls: "badge--pending" },
  published: { label: "ผ่านแล้ว", cls: "badge--published" },
  "published-updating": { label: "ผ่านแล้ว · มีอัปเดตรอตรวจ", cls: "badge--updating" },
  rejected: { label: "ถูกตีกลับ", cls: "badge--rejected" },
  active: { label: "ใช้งานได้ปกติ", cls: "badge--active" },
  suspended: { label: "ถูกระงับ", cls: "badge--suspended" },
};

export default function StatusBadge({ status, title }) {
  const meta = STATUS_META[status] || { label: status, cls: "" };
  return (
    <span className={`badge ${meta.cls}`} title={title}>
      {meta.label}
    </span>
  );
}
