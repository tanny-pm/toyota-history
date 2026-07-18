export function Header() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 0 24px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '56px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '0.16em', color: 'var(--toyota-red)' }}>TOYOTA</span>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>車種系譜ビューア</span>
      </div>
      <nav style={{ display: 'flex', gap: '28px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        <a href="#genealogy" style={{ color: 'var(--text-secondary)' }}>系譜</a>
        <a href="#compare" style={{ color: 'var(--text-secondary)' }}>諸元比較</a>
      </nav>
    </header>
  )
}
