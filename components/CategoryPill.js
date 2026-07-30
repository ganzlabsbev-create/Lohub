import Link from "next/link";

export default function CategoryPill({ category, active = false }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={`cat-pill${active ? " cat-pill--active" : ""}`}
      style={{ "--pill-color": category.color }}
    >
      <span className="cat-pill__icon" aria-hidden="true">{category.icon}</span>
      {category.name}
    </Link>
  );
}
