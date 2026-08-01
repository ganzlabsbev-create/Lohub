import { useTranslation } from "../lib/i18n";

const STATUS_META = {
  pending: { cls: "badge--pending" },
  published: { cls: "badge--published" },
  "published-updating": { cls: "badge--updating" },
  rejected: { cls: "badge--rejected" },
  active: { cls: "badge--active" },
  suspended: { cls: "badge--suspended" },
};

export default function StatusBadge({ status, title }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || { cls: "" };
  const label = STATUS_META[status] ? t(`statusBadge.${status}`) : status;
  return (
    <span className={`badge ${meta.cls}`} title={title}>
      {label}
    </span>
  );
}
