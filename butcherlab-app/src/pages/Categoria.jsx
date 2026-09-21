import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProductGrid from '../components/ProductGrid'
import CartBar from '../CartBar'
import CartDrawer from '../CartDrawer'
import { formatPickupSelection, getPickupDays, getPickupTimes } from '../pickup'
import { supabase } from '../supabase'
import '../App.css'

const nomiCategorie = {
  cavallo: 'Cavallo',
  pollo: 'Pollo',
  maiale: 'Maiale',
  preparati: 'Preparati',
  box: 'Box',
  offerte: 'Offerte',
}

const aliasCategorie = {
  cavallo: ['cavallo', 'equino', 'carne di cavallo'],
  pollo: ['pollo', 'avicoli', 'carne di pollo'],
  maiale: ['maiale', 'suino', 'carne di maiale'],
  preparati: [
    'preparati',
    'preparato',
    'pronti da cuocere',
    'pronto da cuocere',
  ],
  box: ['box', 'box convenienza', 'offerte box'],
  offerte: ['offerte', 'offerta', 'promozioni', 'promozione'],
}

const impostazioniPredefinite = {
  business_name: 'BUTCHER LAB',
  address: 'Corso Matteotti 20, Orta Nova (FG)',
  whatsapp: '3207177369',
  offer_enabled: false,
  offer_product: '',
  offer_price: '',
  orders_enabled: true,
}

function normalizzaTesto(valore = '') {
  return String(valore)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function leggiCarrello() {
  try {
    return JSON.parse(localStorage.getItem('butcherlab-carrello')) || {}
  } catch {
    return {}
  }
}

export default function Categoria() {
  const { nome = '' } = useParams()
  const navigate = useNavigate()
  const chiaveCategoria = normalizzaTesto(nome)

  const [prodotti, setProdotti] = useState([])
  const [impostazioni, setImpostazioni] = useState(impostazioniPredefinite)
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState('')
  const [carrello, setCarrello] = useState(leggiCarrello)
  const [carrelloAperto, setCarrelloAperto] = useState(false)
  const [adesso, setAdesso] = useState(() => new Date())
  const [giornoRitiro, setGiornoRitiro] = useState('')
  const [orarioRitiro, setOrarioRitiro] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setAdesso(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let paginaAttiva = true

    const caricaDati = async () => {
      setCaricamento(true)
      setErrore('')

      const [risultatoProdotti, risultatoImpostazioni] = await Promise.all([
        supabase.from('prodotti').select('*').order('id'),
        supabase
          .from('site_settings')
          .select('*')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      if (!paginaAttiva) return

      if (risultatoProdotti.error) {
        console.error('Errore caricamento prodotti:', risultatoProdotti.error)
        setErrore('Non è stato possibile caricare i prodotti.')
      } else {
        setProdotti(
          (risultatoProdotti.data || []).map((prodotto) => ({
            ...prodotto,
            prezzo: Number(prodotto.prezzo),
            available: prodotto.available !== false,
          }))
        )
      }

      if (!risultatoImpostazioni.error && risultatoImpostazioni.data) {
        setImpostazioni({
          ...impostazioniPredefinite,
          ...risultatoImpostazioni.data,
        })
      }

      setCaricamento(false)
    }

    caricaDati()

    return () => {
      paginaAttiva = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('butcherlab-carrello', JSON.stringify(carrello))
  }, [carrello])

  const prodottiCategoria = useMemo(() => {
    const alias = aliasCategorie[chiaveCategoria] || [chiaveCategoria]

    return prodotti.filter((prodotto) => {
      const categoriaProdotto = normalizzaTesto(prodotto.categoria)
      return alias.includes(categoriaProdotto)
    })
  }, [prodotti, chiaveCategoria])

  const cambiaQuantita = (id, variazione) => {
    setCarrello((attuale) => ({
      ...attuale,
      [id]: Math.max(
        0,
        Number(((attuale[id] || 0) + variazione).toFixed(1))
      ),
    }))
  }

  const prodottiNelCarrello = prodotti.filter(
    (prodotto) => prodotto.available !== false && (carrello[prodotto.id] || 0) > 0
  )

  const prezzoOfferta = Number(
    String(impostazioni.offer_price)
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
  )

  const prezzoProdotto = (prodotto) => {
    const prodottoInOfferta =
      impostazioni.offer_enabled &&
      normalizzaTesto(prodotto.nome) ===
        normalizzaTesto(impostazioni.offer_product) &&
      Number.isFinite(prezzoOfferta)

    return prodottoInOfferta ? prezzoOfferta : prodotto.prezzo
  }

  const totale = prodottiNelCarrello.reduce(
    (somma, prodotto) =>
      somma + prezzoProdotto(prodotto) * carrello[prodotto.id],
    0
  )

  const statoOrdini = {
    aperti: impostazioni.orders_enabled !== false,
    messaggio:
      impostazioni.orders_enabled === false
        ? 'Gli ordini online sono temporaneamente sospesi.'
        : 'Puoi inviare il tuo ordine in qualsiasi momento.',
  }

  const giorniRitiroDisponibili = getPickupDays(adesso)
  const orariRitiroDisponibili = getPickupTimes(giornoRitiro, adesso)
  const ritiroSelezionato = formatPickupSelection(
    giorniRitiroDisponibili,
    giornoRitiro,
    orarioRitiro
  )

  useEffect(() => {
    if (
      giornoRitiro &&
      !giorniRitiroDisponibili.some((giorno) => giorno.value === giornoRitiro)
    ) {
      setGiornoRitiro('')
      setOrarioRitiro('')
      return
    }

    if (orarioRitiro && !orariRitiroDisponibili.includes(orarioRitiro)) {
      setOrarioRitiro('')
    }
  }, [adesso, giornoRitiro, orarioRitiro, impostazioni.orders_enabled])


  const inviaOrdine = () => {
    if (!statoOrdini.aperti) { alert(statoOrdini.messaggio); return }
    if (prodottiNelCarrello.length === 0) {
      alert('Il carrello è vuoto')
      return
    }
    if (!giornoRitiro) { alert('Seleziona il giorno di ritiro'); return }
    if (!orarioRitiro) { alert('Seleziona l’orario di ritiro'); return }

    const righe = prodottiNelCarrello
      .map((prodotto) =>
        normalizzaTesto(prodotto.categoria) === 'box'
          ? `• ${prodotto.nome}: ${carrello[prodotto.id]} box`
          : `• ${prodotto.nome}: ${carrello[prodotto.id].toFixed(1)} kg`
      )
      .join('\n')

    const messaggio = `
NUOVO ORDINE - ${impostazioni.business_name}

${righe}

Totale indicativo: € ${totale.toFixed(2).replace('.', ',')}

RITIRO: ${ritiroSelezionato}
Ritiro e pagamento in negozio.
${impostazioni.address}
    `.trim()

    const numeroWhatsApp = String(impostazioni.whatsapp || '').replace(/\D/g, '')
    const numeroInternazionale = numeroWhatsApp.startsWith('39')
      ? numeroWhatsApp
      : `39${numeroWhatsApp}`

    window.open(
      `https://wa.me/${numeroInternazionale}?text=${encodeURIComponent(messaggio)}`,
      '_blank',
      'noopener,noreferrer'
    )

    setCarrello({})
    setGiornoRitiro('')
    setOrarioRitiro('')
  }

  const titolo = nomiCategorie[chiaveCategoria] || nome

  return (
    <main className="catalogo category-page">
      <button
        type="button"
        className="hero-button"
        onClick={() => navigate('/')}
      >
        ← Torna alle categorie
      </button>

      <p className="catalogo-label">IL NOSTRO CATALOGO</p>
      <h2>{titolo.toUpperCase()}</h2>

      {caricamento && <p>Caricamento prodotti...</p>}
      {errore && <p>{errore}</p>}

      {!caricamento && !errore && prodottiCategoria.length === 0 && (
        <p>Nessun prodotto presente in questa categoria.</p>
      )}

      {!caricamento && !errore && prodottiCategoria.length > 0 && (
        <ProductGrid
          prodotti={prodottiCategoria}
          carrello={carrello}
          cambiaQuantita={cambiaQuantita}
        />
      )}

      <CartBar
        totale={totale}
        numeroProdotti={prodottiNelCarrello.length}
        onApri={() => setCarrelloAperto(true)}
      />

      <CartDrawer
        aperto={carrelloAperto}
        prodotti={prodottiNelCarrello}
        carrello={carrello}
        cambiaQuantita={cambiaQuantita}
        prezzoProdotto={prezzoProdotto}
        totale={totale}
        onClose={() => setCarrelloAperto(false)}
        onInvia={inviaOrdine}
        ordiniAperti={statoOrdini.aperti}
        messaggioOrdini={statoOrdini.messaggio}
        giorniRitiro={giorniRitiroDisponibili}
        giornoRitiro={giornoRitiro}
        onCambiaGiornoRitiro={(giorno) => {
          setGiornoRitiro(giorno)
          setOrarioRitiro('')
        }}
        orariRitiro={orariRitiroDisponibili}
        orarioRitiro={orarioRitiro}
        onCambiaOrarioRitiro={setOrarioRitiro}
        onSvuota={() => {
          setCarrello({})
          setGiornoRitiro('')
          setOrarioRitiro('')
        }}
      />
    </main>
  )
}
