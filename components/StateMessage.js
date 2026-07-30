export default function StateMessage({ kind = "loading", children }) {
  return <div className={`state state--${kind}`}>{children}</div>;
}
