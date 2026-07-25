import { useEffect, useState } from 'react'
import './App.css'
import CartBar from './CartBar'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import AdminPanel from './AdminPanel'
import { supabase } from './supabase'
import { FaWhatsapp } from "react-icons/fa";
import logo from './assets/logo/logo.png'
import cavalloImg from './assets/categories/cavallo.png'
import polloImg from './assets/categories/pollo.png'
import maialeImg from './assets/categories/maiale.png'
import preparatiImg from './assets/categories/preparati.png'
import boxImg from './assets/categories/box.png'
import { Link } from 'react-router-dom'
import ProductGrid from './components/ProductGrid'
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

  const [carrello, setCarrello] = useState({})
  const [ricerca, setRicerca] = useState('')
  const [categoria, setCategoria] = useState('Tutti')
  const [adminAperto, setAdminAperto] = useState(false)
  const [messaggioCarrello, setMessaggioCarrello] = useState('')

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

    const email = window.prompt(
      'Inserisci la tua email amministratore'
    )

    if (!email) return

    const password = window.prompt(
      'Inserisci la password amministratore'
    )

    if (!password) return

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      console.error('Errore login:', error)
      alert('Email o password non corretti')
      return
    }

    setAdminAperto(true)
  }

  const prodottiFiltrati = prodotti.filter(
    (prodotto) => {
      const testo =
        `${prodotto.nome} ${prodotto.descrizione || ''}`.toLowerCase()
    

      const corrispondeRicerca = testo.includes(
        ricerca.toLowerCase()
      )

      const corrispondeCategoria =
        categoria === 'Tutti' ||
        prodotto.categoria === categoria

      return (
        corrispondeRicerca &&
        corrispondeCategoria
      )
    }
  )

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

  cambiaQuantita(prodottoOfferta.id, 1)

setMessaggioCarrello(`${prodottoOfferta.nome} aggiunto al carrello`)

setTimeout(() => {
  setMessaggioCarrello('')
  }, 2500)
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
      (carrello[prodotto.id] || 0) > 0
  )
const prezzoOfferta = Number(
    String(impostazioni.offer_price)
        .replace(',', '.')
            .replace(/[^\d.]/g, '')
            )

            const totale = prodottiNelCarrello.reduce(
              (somma, prodotto) => {
                  const prodottoInOfferta =
                        impostazioni.offer_enabled &&
                              prodotto.nome.trim().toLowerCase() ===
                                      impostazioni.offer_product
                                                .trim()
                                                          .toLowerCase() &&
                                                                Number.isFinite(prezzoOfferta)

                                                                    const prezzoDaUsare = prodottoInOfferta
                                                                          ? prezzoOfferta
                                                                                : prodotto.prezzo

                                                                                    return (
                                                                                          somma +
                                                                                                prezzoDaUsare * carrello[prodotto.id]
                                                                                                    )
                                                                                                      },
                                                                                                        0
                                                                                                        )


  const numeroWhatsApp =
    impostazioni.whatsapp.replace(/\D/g, '')

  const numeroWhatsAppInternazionale =
    numeroWhatsApp.startsWith('39')
      ? numeroWhatsApp
      : `39${numeroWhatsApp}`

  const inviaOrdine = () => {
    if (prodottiNelCarrello.length === 0) {
      alert('Il carrello è vuoto')
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
      {messaggioCarrello && (
          <div className="toast-success">
              ✅ {messaggioCarrello}
                </div>
                )}
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

    <h3>{impostazioni.offer_product}</h3>

    <p className="offer-price">
      {impostazioni.offer_price}
    </p>
{quantitaOfferta > 0 && (
  <div className="offer-quantity">
    <button
      className="offer-quantity-button"
      onClick={(e) => {
        e.stopPropagation()
        cambiaQuantita(prodottoOfferta.id, -1)
      }}
    >
      −
    </button>

    <span>{quantitaOfferta}</span>

    <button
      className="offer-quantity-button"
      onClick={(e) => {
        e.stopPropagation()
        cambiaQuantita(prodottoOfferta.id, 1)
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
            SCOPRI I PRODOTTI
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

        <SearchBar
          valore={ricerca}
          onChange={setRicerca}
        />

        <CategoryFilter
          categoriaAttiva={categoria}
          onChange={setCategoria}
        />

        {!databaseCaricato && (
          <p>Caricamento prodotti...</p>
        )}

        {databaseCaricato &&
          prodottiFiltrati.length === 0 && (
            <p>
              Nessun prodotto trovato.
            </p>
          )}
<section className="category-grid">
<Link
  to="/categoria/cavallo"
  
  className="category-card"
>
  <img src={cavalloImg} alt="Cavallo" />
</Link>

  <button className="category-card">
    <img src={polloImg} alt="Pollo" />
    <span>Pollo</span>
  </button>

  <button className="category-card">
    <img src={maialeImg} alt="Maiale" />
    <span>Maiale</span>
  </button>

  <button className="category-card">
    <img src={preparatiImg} alt="Preparati" />
    <span>Preparati</span>
  </button>

  <button className="category-card">
    <img src={boxImg} alt="Box" />
    <span>Box</span>
  </button>
</section>

        <ProductGrid
  prodotti={prodottiFiltrati}
  carrello={carrello}
  cambiaQuantita={cambiaQuantita}
/>
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
        numeroProdotti={
          prodottiNelCarrello.length
        }
        onInvia={inviaOrdine}
      />

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