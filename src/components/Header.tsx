export function Header() {
  return (
    <header className="mb-14 flex items-center justify-between border-b border-line pt-7 pb-6">
      <div className="flex items-baseline gap-4">
        <span className="text-[26px] font-extrabold tracking-[0.16em] text-toyota-red">TOYOTA</span>
        <span className="text-[15px] font-semibold tracking-[0.02em] text-fg-muted">
          車種系譜ビューア
        </span>
      </div>
      <nav className="flex gap-7 text-sm font-medium text-fg-muted">
        <a href="#genealogy" className="text-fg-muted">
          系譜
        </a>
        <a href="#compare" className="text-fg-muted">
          諸元比較
        </a>
      </nav>
    </header>
  );
}
