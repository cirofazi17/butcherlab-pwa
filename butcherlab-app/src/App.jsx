import { useEffect, useState } from 'react'
import './App.css'
import CartBar from './CartBar'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import AdminPanel from './AdminPanel'
import { supabase } from './supabase'

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

  const [carrello, setCarrello] = useState({})
  const [ricerca, setRicerca] = useState('')
  const [categoria, setCategoria] = useState('Tutti')
  const [adminAperto, setAdminAperto] = useState(false)

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

  const prodottiNelCarrello = prodotti.filter(
    (prodotto) =>
      (carrello[prodotto.id] || 0) > 0
  )

  const totale = prodottiNelCarrello.reduce(
    (somma, prodotto) =>
      somma +
      prodotto.prezzo *
        carrello[prodotto.id],
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
          `• ${prodotto.nome}: ${carrello[
            prodotto.id
          ].toFixed(1)} kg`
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
        <h1 className="logo">
          {impostazioni.business_name}
        </h1>

        <p className="subtitle">
          {impostazioni.subtitle}
        </p>

        <button
          className="admin-access"
          onClick={apriAdmin}
          aria-label="Apri area amministratore"
        >
          ADMIN
        </button>

        <div className="hero-content">
          <p className="hero-label">
            {impostazioni.hero_subtitle}
          </p>

          <h2>
            {impostazioni.hero_title}
          </h2>

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

        <div className="products">
          {prodottiFiltrati.map(
            (prodotto) => {
              const quantita =
                carrello[prodotto.id] || 0

              return (
                <article
                  className="product-card"
                  key={prodotto.id}
                >
                  <div className="product-image">
                    {prodotto.immagine_url ? (
                      <img
                        src={
                          prodotto.immagine_url
                        }
                        alt={prodotto.nome}
                        className="product-image-photo"
                      />
                    ) : (
                      prodotto.simbolo
                    )}
                  </div>

                  <div className="product-info">
                    <h3>{prodotto.nome}</h3>
                    <p>
                      {prodotto.descrizione}
                    </p>
                  </div>

                  <div className="product-action">
                    <strong>
                      €{' '}
                      {prodotto.prezzo
                        .toFixed(2)
                        .replace('.', ',')}{' '}
                      / kg
                    </strong>

                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          cambiaQuantita(
                            prodotto.id,
                            -0.5
                          )
                        }
                        aria-label={`Riduci quantità di ${prodotto.nome}`}
                      >
                        −
                      </button>

                      <span>
                        {quantita.toFixed(1)} kg
                      </span>

                      <button
                        onClick={() =>
                          cambiaQuantita(
                            prodotto.id,
                            0.5
                          )
                        }
                        aria-label={`Aumenta quantità di ${prodotto.nome}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              )
            }
          )}
        </div>
      </main>

      <section className="about-section">
        <p className="catalogo-label">
          CHI SIAMO
        </p>

        <h2>
          {impostazioni.business_name}
        </h2>

        <p>{impostazioni.about_text}</p>
      </section>

      <section className="contact-section">
        <p className="catalogo-label">
          CONTATTI
        </p>

        <h2>VIENI A TROVARCI</h2>

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

        <p>{impostazioni.address}</p>
        <p>{impostazioni.opening_hours}</p>

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
      </footer>

      <button
        type="button"
        className="whatsapp-floating"
        onClick={apriWhatsAppInformazioni}
        aria-label="Contattaci su WhatsApp"
      >
        WhatsApp
      </button>

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