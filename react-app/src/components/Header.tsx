function Header() {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Your daily nutrition companion</p>
        <h1>NutriFlow</h1>
      </div>
      <div className="brand-mark" aria-hidden="true">
        NF
      </div>
      <p className="prototype-notice">
        Prototype only — no real data is saved here.
      </p>
    </header>
  )
}

export default Header
