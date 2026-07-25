export default function ProductGrid({
  prodotti,
  carrello,
  cambiaQuantita,
}) {
  return (
    <div className="products">
      {prodotti.map((prodotto) => {
        const quantita = carrello[prodotto.id] || 0

        return (
          <article
            className="product-card"
            key={prodotto.id}
          >
            <div className="product-image">
              {prodotto.immagine_url ? (
                <img
                  src={prodotto.immagine_url}
                  alt={prodotto.nome}
                  className="product-image-photo"
                />
              ) : (
                prodotto.simbolo
              )}
            </div>

            <div className="product-info">
              <h3>{prodotto.nome}</h3>
              <p>{prodotto.descrizione}</p>
            </div>

            <div className="product-action">
              <strong>
                € {prodotto.prezzo.toFixed(2).replace('.', ',')}
                {prodotto.categoria === 'Box'
                  ? ''
                  : ' al kg'}
              </strong>

              <div className="quantity-control">
                <button
                  onClick={() =>
                    cambiaQuantita(
                      prodotto.id,
                      prodotto.categoria === 'Box'
                        ? -1
                        : -0.5
                    )
                  }
                >
                  −
                </button>

                <span>
                  {prodotto.categoria === 'Box'
                    ? `${quantita} box`
                    : `${quantita.toFixed(1)} kg`}
                </span>

                <button
                  onClick={() =>
                    cambiaQuantita(
                      prodotto.id,
                      prodotto.categoria === 'Box'
                        ? 1
                        : 0.5
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}