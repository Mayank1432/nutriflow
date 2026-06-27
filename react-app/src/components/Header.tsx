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
        Prototype only — mock data is used here. Changes reset on refresh.
      </p>
    </header>
  )
}

export default Header
