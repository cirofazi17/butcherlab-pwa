function CartBar({ totale, numeroProdotti, onInvia }) {
      if (numeroProdotti === 0) {
          return null
            }

              return (
                  <button className="cart-bar-fixed" onClick={onInvia}>
                        <span className="cart-icon">🛒</span>

                              <span className="cart-text">
                                      <strong>INVIA ORDINE</strong>
                                              <small>{numeroProdotti} prodotti</small>
                                                    </span>

                                                          <span className="cart-price">
                                                                  € {totale.toFixed(2).replace('.', ',')}
                                                                        </span>
                                                                            </button>
                                                                              )
                                                                              }

                                                                              export default CartBar
