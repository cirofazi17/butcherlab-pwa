import React from 'react';
import { DELIVERY_CONFIG, formatEuro, getTodayRome, isDeliveryDay, quoteOrder, getDeliveryWindows } from './deliveryRules.js';
import { getPickupDays } from './pickup.js';
import './delivery.css';

/**
 * Modulo di selezione da inserire dentro il carrello esistente.
 * Non invia ordini: il checkout attuale mantiene il controllo dell'invio.
 * @param {number} subtotal Prezzo dei soli prodotti, prima della consegna.
 * @param {object} value Stato del modulo (controllato dal genitore).
 * @param {(next: object) => void} onChange Callback al cambio dati.
 */
export default function DeliveryMethodSelector({ subtotal, value, onChange }) {
  const f = value || { method: '' };
  const isDelivery = f.method === 'delivery';
  const quote = quoteOrder(subtotal, f.method);
  const update = (key, input) => onChange({ ...f, [key]: input });
  const today = getTodayRome();

  return (
    <section className="bl-delivery" aria-label="Modalità di ricezione ordine">
      <h3 className="bl-delivery__title">Come vuoi ricevere il tuo ordine?</h3>
      <div className="bl-delivery__choices" role="radiogroup" aria-label="Modalità ordine">
        <label className={`bl-delivery__choice ${f.method === 'pickup' ? 'is-selected' : ''}`}>
          <input type="radio" name="bl-fulfillment" value="pickup"
            checked={f.method === 'pickup'} onChange={() => update('method', 'pickup')} />
          <span>🏬 Ritiro in negozio</span>
          <small>Gratuito · scegli giorno e ora nel checkout</small>
        </label>
        <label className={`bl-delivery__choice ${isDelivery ? 'is-selected' : ''}`}>
          <input type="radio" name="bl-fulfillment" value="delivery"
            checked={isDelivery} onChange={() => update('method', 'delivery')} />
          <span>🚚 Consegna a domicilio</span>
          <small>Solo Orta Nova · da {formatEuro(DELIVERY_CONFIG.minimumCents)}</small>
        </label>
      </div>

      {isDelivery && (
        <div className="bl-delivery__details">
          {!quote.eligible && (
            <p className="bl-delivery__notice" role="alert">
              Aggiungi altri {formatEuro(quote.minimumRemainingCents)} di prodotti per richiedere la consegna.
            </p>
          )}
          <div className="bl-delivery__grid">
            <label>Nome e cognome *
              <input autoComplete="name" value={f.name || ''} onChange={e => update('name', e.target.value)} required />
            </label>
            <label>Telefono *
              <input type="tel" inputMode="tel" autoComplete="tel" value={f.phone || ''} onChange={e => update('phone', e.target.value)} required />
            </label>
            <label className="bl-delivery__wide">Via / Piazza *
              <input autoComplete="address-line1" value={f.street || ''} onChange={e => update('street', e.target.value)} required />
            </label>
            <label>Numero civico *
              <input value={f.houseNumber || ''} onChange={e => update('houseNumber', e.target.value)} required />
            </label>
            <label>Comune
              <input value="Orta Nova (FG)" disabled aria-label="Comune di consegna: Orta Nova" />
            </label>
            <label>Giorno della consegna *
              <select value={f.deliveryDate || ''} onChange={e => onChange({ ...f, deliveryDate: e.target.value, window: '' })} required>
                <option value="">Scegli il giorno</option>
                {getPickupDays(new Date(), 7).map(giorno => (
                  <option key={giorno.value} value={giorno.value}>{giorno.label}</option>
                ))}
              </select>
            </label>
            <label>Fascia oraria *
              <select value={f.window || ''} onChange={e => update('window', e.target.value)} disabled={!f.deliveryDate} required>
                <option value="">Scegli una fascia</option>
                {getDeliveryWindows(f.deliveryDate).map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </label>
            <label className="bl-delivery__wide">Indicazioni per la consegna (facoltative)
              <textarea rows="2" maxLength="250" value={f.notes || ''}
                onChange={e => update('notes', e.target.value)} placeholder="Citofono, scala, piano..." />
            </label>
          </div>
          {f.deliveryDate && !isDeliveryDay(f.deliveryDate, today) && (
            <p className="bl-delivery__notice" role="alert">La domenica e le date passate non sono disponibili.</p>
          )}
          <p className="bl-delivery__info">Le fasce sono indicative: il negozio confermerà la consegna.</p>
        </div>
      )}

      {f.method && <div className="bl-delivery__summary" aria-live="polite">
        <div><span>Prodotti</span><strong>{formatEuro(quote.itemsCents)}</strong></div>
        {isDelivery && (
          <div><span>Consegna</span><strong>{quote.feeCents ? formatEuro(quote.feeCents) : (!quote.eligible ? 'Non disponibile' : 'Gratis')}</strong></div>
        )}
        <div className="bl-delivery__total"><span>Totale indicativo</span><strong>{formatEuro(quote.totalCents)}</strong></div>
        {isDelivery && <small>Gratuita da {formatEuro(DELIVERY_CONFIG.freeFromCents)} di prodotti.</small>}
      </div>}
    </section>
  );
}
