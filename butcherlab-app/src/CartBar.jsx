function CartBar({ totale, numeroProdotti, onApri }) {
  if (numeroProdotti === 0) return null

  return (
    <button className="cart-bar-fixed" onClick={onApri} type="button" aria-label="Apri il carrello">
      <span className="cart-icon" aria-hidden="true">🛒</span>
      <span className="cart-text">
        <strong>Carrello</strong>
        <small>{numeroProdotti} {numeroProdotti === 1 ? 'prodotto' : 'prodotti'}</small>
      </span>
      <span className="cart-price">€ {totale.toFixed(2).replace('.', ',')}</span>
      <span className="cart-arrow" aria-hidden="true">›</span>
    </button>
  )
}

export default CartBar
