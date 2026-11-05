/** BUTCHER LAB — regole consegna a domicilio per Orta Nova. */
export const DELIVERY_CONFIG = Object.freeze({
  city: 'Orta Nova',
  minimumCents: 2000,
  feeCents: 150,
  freeFromCents: 4000,
  windows: [
    { id: '11-13', label: '11:00–13:00' },
    { id: '18-20', label: '18:00–20:00' },
  ],
  timezone: 'Europe/Rome',
});

export function eurosToCents(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new Error('Importo prodotti non valido');
  return Math.round(value * 100);
}

export function formatEuro(cents) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

export function getTodayRome(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: DELIVERY_CONFIG.timezone,
  }).format(now);
}

export function isDeliveryDay(isoDate, today = getTodayRome()) {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  if (isoDate < today) return false;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) return false;
  return date.getUTCDay() !== 0;
}

// Giovedi e sabato: solo mattina. Domenica: nessuna consegna.
export function getDeliveryWindows(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return [];
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) return [];
  const weekday = date.getUTCDay();
  if (weekday === 0) return [];
  if (weekday === 4 || weekday === 6) return DELIVERY_CONFIG.windows.filter(w => w.id === '11-13');
  return DELIVERY_CONFIG.windows;
}

export function quoteOrder(productsSubtotal, method = 'pickup') {
  const itemsCents = eurosToCents(productsSubtotal);
  const home = method === 'delivery';
  const eligible = !home || itemsCents >= DELIVERY_CONFIG.minimumCents;
  const feeCents = home && eligible && itemsCents < DELIVERY_CONFIG.freeFromCents
    ? DELIVERY_CONFIG.feeCents : 0;
  return {
    eligible,
    itemsCents,
    feeCents,
    totalCents: itemsCents + feeCents,
    minimumRemainingCents: home ? Math.max(0, DELIVERY_CONFIG.minimumCents - itemsCents) : 0,
    isFreeDelivery: home && eligible && feeCents === 0,
  };
}

export function validateFulfillment(productsSubtotal, fulfillment, today = getTodayRome()) {
  const problems = [];
  if (!fulfillment || !['pickup', 'delivery'].includes(fulfillment.method)) return ['Seleziona ritiro o consegna.'];
  const quote = quoteOrder(productsSubtotal, fulfillment.method);
  if (fulfillment.method !== 'delivery') return problems; // Le regole del ritiro restano nel checkout esistente.
  if (!quote.eligible) problems.push(`Per la consegna servono almeno ${formatEuro(DELIVERY_CONFIG.minimumCents)} di prodotti.`);
  if (!String(fulfillment.name || '').trim()) problems.push('Inserisci nome e cognome.');
  const digits = String(fulfillment.phone || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) problems.push('Inserisci un numero di telefono valido.');
  if (!String(fulfillment.street || '').trim()) problems.push('Inserisci la via.');
  if (!String(fulfillment.houseNumber || '').trim()) problems.push('Inserisci il numero civico (oppure SNC).');
  if (String(fulfillment.city || '').trim().toLowerCase() !== DELIVERY_CONFIG.city.toLowerCase()) {
    problems.push('La consegna è disponibile soltanto nel comune di Orta Nova.');
  }
  if (!isDeliveryDay(fulfillment.deliveryDate, today)) problems.push('Seleziona una data valida dal lunedì al sabato.');
  if (!getDeliveryWindows(fulfillment.deliveryDate).some(w => w.id === fulfillment.window)) problems.push('Seleziona una fascia oraria disponibile per il giorno scelto.');
  // Per il giorno stesso non promettere una fascia gia' iniziata: occorrono almeno 30 minuti di anticipo.
  if (fulfillment.deliveryDate === today && today === getTodayRome() && ['11-13', '18-20'].includes(fulfillment.window)) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: DELIVERY_CONFIG.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const hours = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const minutes = Number(parts.find(p => p.type === 'minute')?.value || 0);
    const slotStart = fulfillment.window === '11-13' ? 660 : 1080;
    if (hours * 60 + minutes + 30 > slotStart) {
      problems.push('Questa fascia è già iniziata o è troppo vicina: scegli una fascia successiva o un altro giorno.');
    }
  }
  return problems;
}

export function buildFulfillmentData(productsSubtotal, fulfillment, today = getTodayRome()) {
  const errors = validateFulfillment(productsSubtotal, fulfillment, today);
  if (errors.length) throw new Error(errors.join('\n'));
  const quote = quoteOrder(productsSubtotal, fulfillment.method);
  if (fulfillment.method === 'pickup') {
    return { fulfillmentMethod: 'pickup', deliveryFee: 0, total: quote.totalCents / 100 };
  }
  return {
    fulfillmentMethod: 'delivery',
    recipientName: fulfillment.name.trim(),
    recipientPhone: fulfillment.phone.trim(),
    deliveryAddress: `${fulfillment.street.trim()}, ${fulfillment.houseNumber.trim()}, ${DELIVERY_CONFIG.city} (FG)`,
    deliveryCity: DELIVERY_CONFIG.city,
    deliveryDate: fulfillment.deliveryDate,
    deliveryWindow: fulfillment.window,
    deliveryNotes: (fulfillment.notes || '').trim(),
    deliveryFee: quote.feeCents / 100,
    total: quote.totalCents / 100,
    deliveryStatus: 'da_confermare',
  };
}
