// デザインモックで使われている簡易車体シルエット SVG。
export function CarSilhouette({ color, width }: { color: string; width: string }) {
  return (
    <svg viewBox="0 0 100 44" width={width} style={{ display: 'block' }}>
      <path d="M8 32 L20 32 C23 22 30 18 43 18 L66 18 C77 18 83 22 90 28 L95 30 L95 34 L8 34 Z" fill={color} />
      <circle cx="34" cy="34" r="6" fill="#fff" />
      <circle cx="34" cy="34" r="6" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="78" cy="34" r="6" fill="#fff" />
      <circle cx="78" cy="34" r="6" fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  )
}
