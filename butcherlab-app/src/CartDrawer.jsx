function normalizzaTesto(valore = '') {
  return String(valore)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export default function CartDrawer({
  aperto,
  prodotti,
  carrello,
  cambiaQuantita,
  prezzoProdotto,
  totale,
  onClose,
  onInvia,
  onSvuota,
  ordiniAperti,
  messaggioOrdini,
  giorniRitiro = [],
  giornoRitiro = '',
  onCambiaGiornoRitiro = () => {},
  orariRitiro = [],
  orarioRitiro = '',
  onCambiaOrarioRitiro = () => {},
}) {
  if (!aperto) return null

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Il tuo carrello"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-drawer-header">
          <h2>IL TUO CARRELLO</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi carrello">
            ×
          </button>
        </div>

        <div className="cart-drawer-items">
          {prodotti.length === 0 ? (
            <p className="cart-empty">Il carrello è vuoto.</p>
          ) : (
            prodotti.map((prodotto) => {
              const quantita = carrello[prodotto.id] || 0
              const isBox = normalizzaTesto(prodotto.categoria) === 'box'
              const step = isBox ? 1 : 0.5
              const prezzo = prezzoProdotto(prodotto)

              return (
                <article className="cart-drawer-item" key={prodotto.id}>
                  <div className="cart-drawer-image">
                    {prodotto.immagine_url ? (
                      <img src={prodotto.immagine_url} alt={prodotto.nome} />
                    ) : (
                      <span>{prodotto.simbolo || '🥩'}</span>
                    )}
                  </div>

                  <div className="cart-drawer-info">
                    <strong>{prodotto.nome}</strong>
                    <small>
                      € {prezzo.toFixed(2).replace('.', ',')}
                      {isBox ? '' : '/kg'}
                    </small>

                    <div className="cart-drawer-quantity">
                      <button
                        type="button"
                        onClick={() => cambiaQuantita(prodotto.id, -step)}
                      >
                        −
                      </button>
                      <span>
                        {isBox ? `${quantita} box` : `${quantita.toFixed(1)} kg`}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiaQuantita(prodotto.id, step)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-drawer-line-total">
                    € {(prezzo * quantita).toFixed(2).replace('.', ',')}
                  </div>

                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => cambiaQuantita(prodotto.id, -quantita)}
                    aria-label={`Rimuovi ${prodotto.nome}`}
                  >
                    🗑
                  </button>
                </article>
              )
            })
          )}
        </div>

        <div className="cart-drawer-footer">
          {!ordiniAperti && (
            <div className="cart-order-status closed">
              <strong>ORDINI SOSPESI</strong>
              <span>{messaggioOrdini}</span>
            </div>
          )}

          {ordiniAperti && prodotti.length > 0 && (
            <div className="pickup-time-field">
              <span>ORARIO DI RITIRO</span>

              <div className="pickup-select-grid">
                <label>
                  <strong>GIORNO</strong>
                  <select
                    value={giornoRitiro}
                    onChange={(event) => onCambiaGiornoRitiro(event.target.value)}
                  >
                    <option value="">Scegli il giorno</option>
                    {giorniRitiro.map((giorno) => (
                      <option key={giorno.value} value={giorno.value}>
                        {giorno.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <strong>ORARIO</strong>
                  <select
                    value={orarioRitiro}
                    onChange={(event) => onCambiaOrarioRitiro(event.target.value)}
                    disabled={!giornoRitiro}
                  >
                    <option value="">
                      {giornoRitiro ? 'Scegli l’orario' : 'Prima scegli il giorno'}
                    </option>
                    {orariRitiro.map((orario) => (
                      <option key={orario} value={orario}>{orario}</option>
                    ))}
                  </select>
                </label>
              </div>

            </div>
          )}

          <div className="cart-drawer-total">
            <span>TOTALE</span>
            <strong>€ {totale.toFixed(2).replace('.', ',')}</strong>
          </div>

          <button
            type="button"
            className="cart-checkout"
            onClick={onInvia}
            disabled={prodotti.length === 0 || !ordiniAperti || !giornoRitiro || !orarioRitiro}
          >
            {ordiniAperti ? 'INVIA ORDINE SU WHATSAPP' : 'ORDINI NON DISPONIBILI'}
          </button>

          <button
            type="button"
            className="cart-empty-button"
            onClick={onSvuota}
            disabled={prodotti.length === 0}
          >
            SVUOTA CARRELLO
          </button>
        </div>
      </aside>
    </div>
  )
}
