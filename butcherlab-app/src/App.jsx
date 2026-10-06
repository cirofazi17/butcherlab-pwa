import { useEffect, useState } from 'react'
import './App.css'
import CartBar from './CartBar'
import CartDrawer from './CartDrawer'
import { formatPickupSelection, getPickupDays, getPickupTimes } from './pickup'
import AdminPanel from './AdminPanel'
import { supabase } from './supabase'
import { FaWhatsapp } from "react-icons/fa";
import logo from './assets/logo/logo.png'
import cavalloImg from './assets/categories/cavallo.png'
import polloImg from './assets/categories/pollo.png'
import maialeImg from './assets/categories/maiale.png'
import preparatiImg from './assets/categories/preparati.png'
import boxImg from './assets/categories/box.png'
import vitelloImg from './assets/categories/vitello.png'
import { Link } from 'react-router-dom'
const impostazioniPredefinite = {
  business_name: 'BUTCHER LAB',
  subtitle: 'Macelleria e carni selezionate',
  address: 'Corso Matteotti 20, Orta Nova (FG)',
  phone: '3207177369',
  whatsapp: '3207177369',
  opening_hours: 'Lun-Sab 08:00-13:30 | 17:00-20:30',
  about_text:
    'BUTCHER LAB seleziona ogni giorno carni di qualità, preparazioni artigianali e prodotti scelti con passione.',
  hero_title: 'La migliore carne, ogni giorno',
  hero_subtitle: 'Carne di qualità, scelta con passione',
  maps_url: '',
  instagram_url: '',
  facebook_url: '',
  offer_enabled: false,
  offer_title: 'OFFERTA DELLA SETTIMANA',
  offer_product: '',
  offer_original_price: '',
  offer_price: '',
  offer_image_url: '',
  offer_note: '',
  orders_enabled: true,
}

function App() {

  const [prodotti, setProdotti] = useState([])
  const [databaseCaricato, setDatabaseCaricato] =
    useState(false)

  const [impostazioni, setImpostazioni] = useState(
    impostazioniPredefinite
  )
  const categorieHome = [
  {
    nome: 'Cavallo',
    immagine: cavalloImg,
    filtro: 'Cavallo'
  },
  {
  nome: 'Vitello',
  immagine: vitelloImg,
  filtro: 'Vitello'
},
  {
    nome: 'Pollo',
    immagine: polloImg,
    filtro: 'Pollo'
  },
  {
    nome: 'Maiale',
    immagine: maialeImg,
    filtro: 'Maiale'
  },
  {
    nome: 'Preparati',
    immagine: preparatiImg,
    filtro: 'Preparati'
  },
  {
    nome: 'Box',
    immagine: boxImg,
    filtro: 'Box'
  }
]

  const [carrello, setCarrello] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('butcherlab-carrello')) || {}
    } catch {
      return {}
    }
  })
  const [adminAperto, setAdminAperto] = useState(false)
  const [loginAdminAperto, setLoginAdminAperto] = useState(false)
  const [emailAdmin, setEmailAdmin] = useState('')
  const [passwordAdmin, setPasswordAdmin] = useState('')
  const [erroreLoginAdmin, setErroreLoginAdmin] = useState('')
  const [loginAdminInCorso, setLoginAdminInCorso] = useState(false)
  const [carrelloAperto, setCarrelloAperto] = useState(false)
  const [adesso, setAdesso] = useState(() => new Date())
  const [giornoRitiro, setGiornoRitiro] = useState('')
  const [orarioRitiro, setOrarioRitiro] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setAdesso(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'butcherlab-carrello',
      JSON.stringify(carrello)
    )
  }, [carrello])

  useEffect(() => {
    const caricaDati = async () => {
      const [
        risultatoProdotti,
        risultatoImpostazioni,
      ] = await Promise.all([
        supabase
          .from('prodotti')
          .select('*')
          .order('id'),

        supabase
          .from('site_settings')
          .select('*')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      if (risultatoProdotti.error) {
        console.error(
          'Errore caricamento prodotti:',
          risultatoProdotti.error
        )
        alert('Errore nel collegamento al database')
      } else {
        setProdotti(
          (risultatoProdotti.data || []).map(
            (prodotto) => ({
              ...prodotto,
              prezzo: Number(prodotto.prezzo),
              available: prodotto.available !== false,
            })
          )
        )
      }

      if (risultatoImpostazioni.error) {
        console.error(
          'Errore caricamento impostazioni:',
          risultatoImpostazioni.error
        )
      } else if (risultatoImpostazioni.data) {
        setImpostazioni({
          ...impostazioniPredefinite,
          ...risultatoImpostazioni.data,
        })
      }

      setDatabaseCaricato(true)
    }

    caricaDati()
  }, [])

  const apriAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      setAdminAperto(true)
      return
    }

    setErroreLoginAdmin('')
    setPasswordAdmin('')
    setLoginAdminAperto(true)
  }

  const chiudiLoginAdmin = () => {
    if (loginAdminInCorso) return
    setLoginAdminAperto(false)
    setErroreLoginAdmin('')
    setPasswordAdmin('')
  }

  const accediAdmin = async (event) => {
    event.preventDefault()

    const email = emailAdmin.trim()
    if (!email || !passwordAdmin) {
      setErroreLoginAdmin('Inserisci email e password.')
      return
    }

    setLoginAdminInCorso(true)
    setErroreLoginAdmin('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordAdmin,
    })

    setLoginAdminInCorso(false)

    if (error) {
      console.error('Errore login:', error)
      setErroreLoginAdmin('Email o password non corretti.')
      return
    }

    setLoginAdminAperto(false)
    setPasswordAdmin('')
    setAdminAperto(true)
  }

  const cambiaQuantita = (id, variazione) => {
    setCarrello((attuale) => ({
      ...attuale,
      [id]: Math.max(
        0,
        Number(
          (
            (attuale[id] || 0) +
            variazione
          ).toFixed(1)
        )
      ),
    }))
  }
  const aggiungiOffertaAlCarrello = () => {
  const nomeOfferta = impostazioni.offer_product
    .trim()
    .toLowerCase()

  const prodottoOfferta = prodotti.find(
    (prodotto) =>
      prodotto.nome
        .trim()
        .toLowerCase() === nomeOfferta
  )

  if (!prodottoOfferta) {
    alert(
      'Prodotto in offerta non trovato nel catalogo.'
    )
    return
  }

  cambiaQuantita(prodottoOfferta.id, 0.5)

}
const prodottoOfferta = prodotti.find(
  (prodotto) =>
    prodotto.nome.trim().toLowerCase() ===
    impostazioni.offer_product.trim().toLowerCase()
)

const quantitaOfferta = prodottoOfferta
  ? carrello[prodottoOfferta.id] || 0
  : 0
  const prodottiNelCarrello = prodotti.filter(
    (prodotto) =>
      prodotto.available !== false && (carrello[prodotto.id] || 0) > 0
  )
const prezzoOfferta = Number(
    String(impostazioni.offer_price)
        .replace(',', '.')
            .replace(/[^\d.]/g, '')
            )

  const prezzoProdotto = (prodotto) => {
    const prodottoInOfferta =
      impostazioni.offer_enabled &&
      prodotto.nome.trim().toLowerCase() ===
        impostazioni.offer_product.trim().toLowerCase() &&
      Number.isFinite(prezzoOfferta)

    return prodottoInOfferta ? prezzoOfferta : prodotto.prezzo
  }

  const totale = prodottiNelCarrello.reduce(
    (somma, prodotto) =>
      somma + prezzoProdotto(prodotto) * carrello[prodotto.id],
    0
  )


  const numeroWhatsApp =
    impostazioni.whatsapp.replace(/\D/g, '')

  const numeroWhatsAppInternazionale =
    numeroWhatsApp.startsWith('39')
      ? numeroWhatsApp
      : `39${numeroWhatsApp}`


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
    if (!statoOrdini.aperti) {
      alert(statoOrdini.messaggio)
      return
    }

    if (prodottiNelCarrello.length === 0) {
      alert('Il carrello è vuoto')
      return
    }

    if (!giornoRitiro) {
      alert('Seleziona il giorno di ritiro')
      return
    }

    if (!orarioRitiro) {
      alert('Seleziona l’orario di ritiro')
      return
    }

    const righe = prodottiNelCarrello
      .map(
        (prodotto) =>
         prodotto.categoria === 'Box'
  ? `• ${prodotto.nome}: ${carrello[prodotto.id]} box`
  : `• ${prodotto.nome}: ${carrello[prodotto.id].toFixed(1)} kg`
      )
      .join('\n')

    const messaggio = `
NUOVO ORDINE - ${impostazioni.business_name}

${righe}

Totale indicativo: € ${totale
      .toFixed(2)
      .replace('.', ',')}

RITIRO: ${ritiroSelezionato}
Ritiro e pagamento in negozio.
${impostazioni.address}
    `.trim()

    window.open(
      `https://wa.me/${numeroWhatsAppInternazionale}?text=${encodeURIComponent(
        messaggio
      )}`,
      '_blank',
      'noopener,noreferrer'
    )
    setCarrello({})
    setGiornoRitiro('')
    setOrarioRitiro('')
  }

  const apriWhatsAppInformazioni = () => {
    const messaggio =
      `Ciao ${impostazioni.business_name}! Vorrei avere informazioni sui vostri prodotti.`

    window.open(
      `https://wa.me/${numeroWhatsAppInternazionale}?text=${encodeURIComponent(
        messaggio
      )}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className="app">
      <header className="hero">
      <img
  src={logo}
  alt="BUTCHER LAB"
  className="hero-logo"
/>

        <div className="hero-content">
          <p className="hero-label">
            {impostazioni.hero_subtitle}
          </p>

         <h2 className="hero-title">
  <span className="hero-script">La miglior carne,</span>
  <span className="hero-bold">OGNI GIORNO</span>
</h2>
{impostazioni.offer_enabled && (
<div
  className="offer-banner"
  onClick={aggiungiOffertaAlCarrello}
  style={{ cursor: "pointer" }}
>
    <span className="offer-badge">
      🔥 {impostazioni.offer_title}
    </span>

    <div className="offer-banner-content">
      {impostazioni.offer_image_url && (
        <img
          className="offer-product-image"
          src={impostazioni.offer_image_url}
          alt={impostazioni.offer_product || 'Offerta della settimana'}
        />
      )}

      <div className="offer-banner-details">
        <h3>{impostazioni.offer_product}</h3>

        <div className="offer-prices">
          {impostazioni.offer_original_price && (
            <span className="offer-original-price">
              {impostazioni.offer_original_price}
              {!/\b(?:al\s*kg|\/\s*kg)\b/i.test(impostazioni.offer_original_price) && ' al kg'}
            </span>
          )}
          <span className="offer-price">
            {impostazioni.offer_price}
            {!/\b(?:al\s*kg|\/\s*kg)\b/i.test(impostazioni.offer_price) && ' al kg'}
          </span>
        </div>
      </div>
    </div>
{quantitaOfferta > 0 && (
  <div className="offer-quantity">
    <button
      className="offer-quantity-button"
      onClick={(e) => {
        e.stopPropagation()
        cambiaQuantita(prodottoOfferta.id, -0.5)
      }}
    >
      −
    </button>

    <span>{`${Number.isInteger(quantitaOfferta) ? quantitaOfferta : quantitaOfferta.toFixed(1).replace('.', ',')} kg`}</span>

    <button
      className="offer-quantity-button"
      onClick={(e) => {
        e.stopPropagation()
        cambiaQuantita(prodottoOfferta.id, 0.5)
      }}
    >
      +
    </button>
  </div>
)}
    {impostazioni.offer_note && (
      <p className="offer-note">
        {impostazioni.offer_note}
      </p>
    )}
  </div>
)}
          <a
            className="hero-button"
            href="#catalogo"
          >
            ORDINA ORA
          </a>
        </div>
      </header>

      <main
        id="catalogo"
        className="catalogo"
      >
        <p className="catalogo-label">
          IL NOSTRO CATALOGO
        </p>

        <h2>SCEGLI LA TUA CARNE</h2>

<section className="category-grid">
  {categorieHome.map((categoriaHome) => (
    <Link
      key={categoriaHome.filtro}
      to={`/categoria/${categoriaHome.filtro.toLowerCase()}`}
      className="category-card"
      aria-label={`Apri la categoria ${categoriaHome.nome}`}
    >
      <img
        src={categoriaHome.immagine}
        alt={categoriaHome.nome}
      />
    </Link>
  ))}
</section>

      </main>


      <section className="contact-section">
        <p className="catalogo-label">
          CONTATTI
        </p>


        <p>
          <strong>Indirizzo:</strong>{' '}
          {impostazioni.address}
        </p>

        <p>
          <strong>Telefono:</strong>{' '}
          <a
            href={`tel:${impostazioni.phone.replace(
              /\s/g,
              ''
            )}`}
          >
            {impostazioni.phone}
          </a>
        </p>

        <p>
          <strong>Orari:</strong>{' '}
          {impostazioni.opening_hours}
        </p>

        {impostazioni.maps_url && (
          <a
            className="hero-button"
            href={impostazioni.maps_url}
            target="_blank"
            rel="noreferrer"
          >
            APRI GOOGLE MAPS
          </a>
        )}
      </section>

      <footer className="site-footer">
        <strong>
          {impostazioni.business_name}
          </strong>
 <p>
  ©{new Date().getFullYear()} {impostazioni.business_name}</p>       

        <div className="footer-social">
          {impostazioni.instagram_url && (
            <a
              href={
                impostazioni.instagram_url
              }
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          )}

          {impostazioni.facebook_url && (
            <a
              href={
                impostazioni.facebook_url
              }
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
          )}
        </div>
        <button
          type="button"
            className="admin-access-footer"
              onClick={apriAdmin}
                aria-label="Apri area amministratore"
                >
                  Admin
                  </button>
      </footer>
<div className="footer-whatsapp">
  <button
    type="button"
    className="whatsapp-footer-button"
    onClick={apriWhatsAppInformazioni}
    aria-label="Contattaci su WhatsApp"
  >
    <FaWhatsapp size={28} />
    <span>Contattaci su WhatsApp</span>
  </button>
</div>
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

      {loginAdminAperto && (
        <div
          className="admin-login-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) chiudiLoginAdmin()
          }}
        >
          <form
            className="admin-login-modal"
            onSubmit={accediAdmin}
            aria-label="Accesso amministratore"
          >
            <button
              type="button"
              className="admin-login-close"
              onClick={chiudiLoginAdmin}
              aria-label="Chiudi accesso amministratore"
              disabled={loginAdminInCorso}
            >
              ×
            </button>

            <p className="admin-login-label">AREA RISERVATA</p>
            <h2>Accesso Admin</h2>
            <p className="admin-login-description">
              Inserisci le credenziali amministratore.
            </p>

            <label className="admin-login-field">
              <span>Email</span>
              <input
                type="email"
                value={emailAdmin}
                onChange={(event) => setEmailAdmin(event.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </label>

            <label className="admin-login-field">
              <span>Password</span>
              <input
                type="password"
                value={passwordAdmin}
                onChange={(event) => setPasswordAdmin(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {erroreLoginAdmin && (
              <p className="admin-login-error" role="alert">
                {erroreLoginAdmin}
              </p>
            )}

            <div className="admin-login-actions">
              <button
                type="button"
                className="admin-login-cancel"
                onClick={chiudiLoginAdmin}
                disabled={loginAdminInCorso}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="admin-login-submit"
                disabled={loginAdminInCorso}
              >
                {loginAdminInCorso ? 'Accesso…' : 'Accedi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {adminAperto && (
        <AdminPanel
          prodotti={prodotti}
          setProdotti={setProdotti}
          onClose={() => {
            setAdminAperto(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

export default App