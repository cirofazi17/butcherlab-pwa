import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const categorieCatalogo = ['Tutti', 'Cavallo', 'Pollo', 'Maiale', 'Preparati', 'Box', 'Offerte']

const prodottoVuoto = {
  nome: '',
  descrizione: '',
  prezzo: '',
  categoria: 'Preparati',
  simbolo: '🥩',
  immagine_url: '',
  available: true,
}

const impostazioniVuote = {
  id: null,
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

function AdminPanel({ prodotti, setProdotti, onClose }) {
  const [sezioneAttiva, setSezioneAttiva] =
    useState('catalogo')
  const [sezioneSitoAttiva, setSezioneSitoAttiva] = useState('negozio')
  const [modalitaRapida, setModalitaRapida] = useState(true)
  const [prodottoOffertaSelezionato, setProdottoOffertaSelezionato] = useState('')

  const [nuovoProdotto, setNuovoProdotto] =
    useState(prodottoVuoto)
  const [categoriaAttiva, setCategoriaAttiva] = useState('Tutti')
  const [prodottoInModifica, setProdottoInModifica] = useState(null)
  const [mostraNuovoProdotto, setMostraNuovoProdotto] = useState(false)

  const [
    immagineNuovoProdotto,
    setImmagineNuovoProdotto,
  ] = useState(null)

  const [caricamentoImmagine, setCaricamentoImmagine] =
    useState(false)

  const [immagineOfferta, setImmagineOfferta] = useState(null)
  const [caricamentoImmagineOfferta, setCaricamentoImmagineOfferta] =
    useState(false)

  const [impostazioni, setImpostazioni] =
    useState(impostazioniVuote)

  const [
    caricamentoImpostazioni,
    setCaricamentoImpostazioni,
  ] = useState(true)

  const [
    salvataggioImpostazioni,
    setSalvataggioImpostazioni,
  ] = useState(false)
  useEffect(() => {
    caricaImpostazioni()
  }, [])

  const caricaImpostazioni = async () => {
    setCaricamentoImpostazioni(true)

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Errore impostazioni:', error)
      alert('Errore durante il caricamento delle impostazioni')
      setCaricamentoImpostazioni(false)
      return
    }

    if (data) {
      setImpostazioni({
        ...impostazioniVuote,
        ...data,
      })
    }

    setCaricamentoImpostazioni(false)
  }

  const aggiornaImpostazione = (campo, valore) => {
    setImpostazioni((attuali) => ({
      ...attuali,
      [campo]: valore,
    }))
  }

  const salvaImpostazioni = async () => {
    setSalvataggioImpostazioni(true)

    let immagineOffertaUrl = impostazioni.offer_image_url || ''

    if (immagineOfferta) {
      setCaricamentoImmagineOfferta(true)

      const estensione =
        immagineOfferta.name.split('.').pop()?.toLowerCase() || 'jpg'
      const nomeFile = `offerta-settimana-${Date.now()}.${estensione}`

      const { error: erroreUpload } = await supabase.storage
        .from('Prodotti')
        .upload(nomeFile, immagineOfferta, {
          cacheControl: '3600',
          upsert: false,
        })

      if (erroreUpload) {
        console.error(erroreUpload)
        alert('Errore durante il caricamento dell’immagine dell’offerta')
        setCaricamentoImmagineOfferta(false)
        setSalvataggioImpostazioni(false)
        return
      }

      const { data } = supabase.storage
        .from('Prodotti')
        .getPublicUrl(nomeFile)

      immagineOffertaUrl = data.publicUrl
      setCaricamentoImmagineOfferta(false)
    }

    const datiDaSalvare = {
      business_name: impostazioni.business_name.trim(),
      subtitle: impostazioni.subtitle.trim(),
      address: impostazioni.address.trim(),
      phone: impostazioni.phone.trim(),
      whatsapp: impostazioni.whatsapp.trim(),
      opening_hours: impostazioni.opening_hours.trim(),
      about_text: impostazioni.about_text.trim(),
      hero_title: impostazioni.hero_title.trim(),
      hero_subtitle: impostazioni.hero_subtitle.trim(),
      maps_url: impostazioni.maps_url.trim(),
      instagram_url: impostazioni.instagram_url.trim(),
      facebook_url: impostazioni.facebook_url.trim(),
      offer_enabled: impostazioni.offer_enabled,
offer_title: impostazioni.offer_title.trim(),
offer_product: impostazioni.offer_product.trim(),
offer_original_price: impostazioni.offer_original_price.trim(),
offer_price: impostazioni.offer_price.trim(),
offer_image_url: immagineOffertaUrl,
offer_note: impostazioni.offer_note.trim(),
orders_enabled: impostazioni.orders_enabled !== false,
      updated_at: new Date().toISOString(),
    }

    let risultato

    if (impostazioni.id) {
      risultato = await supabase
        .from('site_settings')
        .update(datiDaSalvare)
        .eq('id', impostazioni.id)
        .select()
        .single()
    } else {
      risultato = await supabase
        .from('site_settings')
        .insert(datiDaSalvare)
        .select()
        .single()
    }

    if (risultato.error) {
      console.error(
        'Errore salvataggio impostazioni:',
        risultato.error
      )
      alert('Errore durante il salvataggio')
      setSalvataggioImpostazioni(false)
      return
    }

    setImpostazioni({
      ...impostazioniVuote,
      ...risultato.data,
    })

    setImmagineOfferta(null)
    setSalvataggioImpostazioni(false)
    alert('Impostazioni salvate correttamente')
  }

  const modificaProdotto = async (id, campo, valore) => {
    const valoreCorretto =
      campo === 'prezzo' ? Number(valore) : valore

    setProdotti((attuali) =>
      attuali.map((prodotto) =>
        prodotto.id === id
          ? {
              ...prodotto,
              [campo]: valoreCorretto,
            }
          : prodotto
      )
    )

    const { error } = await supabase
      .from('prodotti')
      .update({
        [campo]: valoreCorretto,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Errore durante la modifica del prodotto')
    }
  }

  const caricaImmagine = async (file, prodottoId) => {
    if (!file) return null

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine')
      return null
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L’immagine non può superare 5 MB')
      return null
    }

    const estensione =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const nomeFile =
      `prodotto-${prodottoId}-${Date.now()}.${estensione}`

    const { error: erroreUpload } = await supabase.storage
      .from('Prodotti')
      .upload(nomeFile, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (erroreUpload) {
      console.error(erroreUpload)
      alert('Errore durante il caricamento della foto')
      return null
    }

    const { data } = supabase.storage
      .from('Prodotti')
      .getPublicUrl(nomeFile)

    return data.publicUrl
  }

  const modificaImmagineProdotto = async (
    prodottoId,
    file
  ) => {
    if (!file) return

    setCaricamentoImmagine(true)

    const immagineUrl = await caricaImmagine(
      file,
      prodottoId
    )

    if (!immagineUrl) {
      setCaricamentoImmagine(false)
      return
    }

    const { error } = await supabase
      .from('prodotti')
      .update({
        immagine_url: immagineUrl,
      })
      .eq('id', prodottoId)

    if (error) {
      console.error(error)
      alert('Foto caricata, ma non salvata nel prodotto')
      setCaricamentoImmagine(false)
      return
    }

    setProdotti((attuali) =>
      attuali.map((prodotto) =>
        prodotto.id === prodottoId
          ? {
              ...prodotto,
              immagine_url: immagineUrl,
            }
          : prodotto
      )
    )

    setCaricamentoImmagine(false)
    alert('Foto salvata correttamente')
  }

  const eliminaProdotto = async (id) => {
    const conferma = window.confirm(
      'Vuoi eliminare questo prodotto?'
    )

    if (!conferma) return

    const { error } = await supabase
      .from('prodotti')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Errore durante l’eliminazione')
      return
    }

    setProdotti((attuali) =>
      attuali.filter((prodotto) => prodotto.id !== id)
    )
  }

  const aggiungiProdotto = async () => {
    if (
      !nuovoProdotto.nome.trim() ||
      !nuovoProdotto.prezzo
    ) {
      alert('Inserisci almeno nome e prezzo')
      return false
    }

    const prodottoDaSalvare = {
      nome: nuovoProdotto.nome.trim(),
      descrizione: nuovoProdotto.descrizione.trim(),
      prezzo: Number(nuovoProdotto.prezzo),
      categoria: nuovoProdotto.categoria,
      simbolo: nuovoProdotto.simbolo || '🥩',
      immagine_url: '',
      available: true,
    }

    const { data, error } = await supabase
      .from('prodotti')
      .insert(prodottoDaSalvare)
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Errore durante il salvataggio del prodotto')
      return false
    }

    let prodottoCompleto = {
      ...data,
      prezzo: Number(data.prezzo),
    }

    if (immagineNuovoProdotto) {
      setCaricamentoImmagine(true)

      const immagineUrl = await caricaImmagine(
        immagineNuovoProdotto,
        data.id
      )

      if (immagineUrl) {
        const { error: erroreFoto } = await supabase
          .from('prodotti')
          .update({
            immagine_url: immagineUrl,
          })
          .eq('id', data.id)

        if (!erroreFoto) {
          prodottoCompleto = {
            ...prodottoCompleto,
            immagine_url: immagineUrl,
          }
        } else {
          console.error(erroreFoto)
          alert(
            'Prodotto creato, ma la foto non è stata salvata'
          )
        }
      }

      setCaricamentoImmagine(false)
    }

    setProdotti((attuali) => [
      ...attuali,
      prodottoCompleto,
    ])

    setNuovoProdotto(prodottoVuoto)
    setImmagineNuovoProdotto(null)
    alert('Prodotto aggiunto correttamente')
    return true
  }

  const esciAdmin = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Errore logout:', error)
      alert('Errore durante la disconnessione')
      return
    }

    onClose()
  }

  return (
    <div className="admin-overlay">
      <section className="admin-panel">
        <div className="admin-header">
          <div>
            <p>AREA RISERVATA</p>
            <h2>GESTIONE BUTCHER LAB</h2>
          </div>

          <button onClick={onClose}>×</button>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={
              sezioneAttiva === 'catalogo'
                ? 'admin-tab active'
                : 'admin-tab'
            }
            onClick={() => setSezioneAttiva('catalogo')}
          >
            CATALOGO
          </button>

          <button
            type="button"
            className={
              sezioneAttiva === 'impostazioni'
                ? 'admin-tab active'
                : 'admin-tab'
            }
            onClick={() =>
              setSezioneAttiva('impostazioni')
            }
          >
            GESTIONE SITO
          </button>
        </div>

        <div className="admin-quick-mode">
          <div>
            <strong>Modalità rapida</strong>
            <span>Mostra solo le operazioni usate più spesso.</span>
          </div>
          <label className="admin-quick-switch">
            <input
              type="checkbox"
              checked={modalitaRapida}
              onChange={(evento) => setModalitaRapida(evento.target.checked)}
            />
            <span>{modalitaRapida ? 'ATTIVA' : 'COMPLETA'}</span>
          </label>
        </div>

        {modalitaRapida && (
          <div className="admin-quick-actions">
            <button type="button" onClick={() => { setSezioneAttiva('catalogo'); setMostraNuovoProdotto(true); setProdottoInModifica(null) }}>
              <span>＋</span><b>Aggiungi prodotto</b>
            </button>
            <button type="button" onClick={() => { setSezioneAttiva('catalogo'); setMostraNuovoProdotto(false) }}>
              <span>€</span><b>Cambia prezzi</b>
            </button>
            <button type="button" onClick={() => { setSezioneAttiva('impostazioni'); setSezioneSitoAttiva('offerta') }}>
              <span>🏷️</span><b>Offerta settimanale</b>
            </button>
            <button type="button" onClick={() => { setSezioneAttiva('impostazioni'); setSezioneSitoAttiva('ordini') }}>
              <span>🕒</span><b>Gestione ordini</b>
            </button>
          </div>
        )}

        {sezioneAttiva === 'catalogo' && (
          <div className="admin-catalogo-semplice">
            <div className="admin-catalogo-toolbar">
              <div>
                <p className="admin-section-label">PRODOTTI</p>
                <h3>Catalogo</h3>
              </div>

              <button
                type="button"
                className="admin-new-toggle"
                onClick={() => {
                  setMostraNuovoProdotto((attuale) => !attuale)
                  setProdottoInModifica(null)
                }}
              >
                {mostraNuovoProdotto ? 'ANNULLA' : '+ AGGIUNGI PRODOTTO'}
              </button>
            </div>

            {mostraNuovoProdotto && (
              <div className="admin-new-product admin-new-product-top">
                <h3>NUOVO PRODOTTO</h3>

                {immagineNuovoProdotto && (
                  <img
                    className="admin-new-image-preview"
                    src={URL.createObjectURL(immagineNuovoProdotto)}
                    alt="Anteprima nuovo prodotto"
                  />
                )}

                <label>
                  Foto prodotto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={caricamentoImmagine}
                    onChange={(evento) =>
                      setImmagineNuovoProdotto(
                        evento.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                <input
                  type="text"
                  placeholder="Nome prodotto"
                  value={nuovoProdotto.nome}
                  onChange={(evento) =>
                    setNuovoProdotto({
                      ...nuovoProdotto,
                      nome: evento.target.value,
                    })
                  }
                />

                <div className="admin-row admin-row-price">
                  <select
                    value={nuovoProdotto.categoria}
                    onChange={(evento) =>
                      setNuovoProdotto({
                        ...nuovoProdotto,
                        categoria: evento.target.value,
                      })
                    }
                  >
                    {categorieCatalogo.slice(1).map((categoria) => (
                      <option key={categoria}>{categoria}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder="Prezzo €/kg"
                    value={nuovoProdotto.prezzo}
                    onChange={(evento) =>
                      setNuovoProdotto({
                        ...nuovoProdotto,
                        prezzo: evento.target.value,
                      })
                    }
                  />
                </div>

                {!modalitaRapida && (
                  <textarea
                    placeholder="Descrizione (facoltativa)"
                    value={nuovoProdotto.descrizione}
                    onChange={(evento) =>
                      setNuovoProdotto({
                        ...nuovoProdotto,
                        descrizione: evento.target.value,
                      })
                    }
                  />
                )}

                <button
                  type="button"
                  className="admin-add"
                  disabled={caricamentoImmagine}
                  onClick={async () => {
                    const aggiunto = await aggiungiProdotto()
                    if (aggiunto) setMostraNuovoProdotto(false)
                  }}
                >
                  {caricamentoImmagine
                    ? 'CARICAMENTO FOTO...'
                    : 'SALVA PRODOTTO'}
                </button>
              </div>
            )}

            <div className="admin-category-tabs" aria-label="Filtra prodotti per categoria">
              {categorieCatalogo.map((categoria) => (
                <button
                  type="button"
                  key={categoria}
                  className={categoriaAttiva === categoria ? 'active' : ''}
                  onClick={() => {
                    setCategoriaAttiva(categoria)
                    setProdottoInModifica(null)
                  }}
                >
                  {categoria}
                </button>
              ))}
            </div>

            <div className="admin-products-compact">
              {prodotti
                .filter(
                  (prodotto) =>
                    categoriaAttiva === 'Tutti' ||
                    prodotto.categoria === categoriaAttiva
                )
                .map((prodotto) => {
                  const aperto = prodottoInModifica === prodotto.id

                  return (
                    <article className="admin-product-compact" key={prodotto.id}>
                      <div className="admin-product-summary">
                        <div className="admin-product-thumb">
                          {prodotto.immagine_url ? (
                            <img src={prodotto.immagine_url} alt={prodotto.nome} />
                          ) : (
                            <span>{prodotto.simbolo || '🥩'}</span>
                          )}
                        </div>

                        <div className="admin-product-main-info">
                          <strong>{prodotto.nome}</strong>
                          <span>{prodotto.categoria}</span>
                          {prodotto.available === false && (
                            <em className="admin-soldout-badge">ESAURITO</em>
                          )}
                        </div>

                        <button
                          type="button"
                          className={prodotto.available === false ? 'admin-stock-toggle soldout' : 'admin-stock-toggle available'}
                          onClick={() =>
                            modificaProdotto(
                              prodotto.id,
                              'available',
                              prodotto.available === false
                            )
                          }
                        >
                          {prodotto.available === false ? 'RIATTIVA' : 'ESAURITO'}
                        </button>

                        <div className="admin-product-price">
                          € {Number(prodotto.prezzo).toFixed(2).replace('.', ',')}
                          <small>/kg</small>
                        </div>

                        <button
                          type="button"
                          className="admin-edit-toggle"
                          onClick={() => {
                            setProdottoInModifica(aperto ? null : prodotto.id)
                            setMostraNuovoProdotto(false)
                          }}
                        >
                          {aperto ? 'CHIUDI' : 'MODIFICA'}
                        </button>
                      </div>

                      {aperto && (
                        <div className="admin-product-edit admin-product-edit-open">
                          <label>
                            Cambia foto
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={caricamentoImmagine}
                              onChange={(evento) =>
                                modificaImmagineProdotto(
                                  prodotto.id,
                                  evento.target.files?.[0]
                                )
                              }
                            />
                          </label>

                          <input
                            type="text"
                            value={prodotto.nome}
                            placeholder="Nome prodotto"
                            onChange={(evento) =>
                              modificaProdotto(
                                prodotto.id,
                                'nome',
                                evento.target.value
                              )
                            }
                          />

                          <div className="admin-row admin-row-price">
                            <select
                              value={prodotto.categoria}
                              onChange={(evento) =>
                                modificaProdotto(
                                  prodotto.id,
                                  'categoria',
                                  evento.target.value
                                )
                              }
                            >
                              {categorieCatalogo.slice(1).map((categoria) => (
                                <option key={categoria}>{categoria}</option>
                              ))}
                            </select>

                            <input
                              type="number"
                              step="0.10"
                              min="0"
                              value={prodotto.prezzo}
                              placeholder="Prezzo"
                              onChange={(evento) =>
                                modificaProdotto(
                                  prodotto.id,
                                  'prezzo',
                                  evento.target.value
                                )
                              }
                            />
                          </div>

                          {!modalitaRapida && (
                            <>
                              <textarea
                                value={prodotto.descrizione || ''}
                                placeholder="Descrizione"
                                onChange={(evento) =>
                                  modificaProdotto(
                                    prodotto.id,
                                    'descrizione',
                                    evento.target.value
                                  )
                                }
                              />

                              <button
                                type="button"
                                className="admin-delete"
                                onClick={() => eliminaProdotto(prodotto.id)}
                              >
                                ELIMINA PRODOTTO
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
            </div>
          </div>
        )}

        {sezioneAttiva === 'impostazioni' && (
          <div className="admin-settings admin-site-manager">
            <div className="admin-site-heading">
              <div>
                <p className="admin-section-label">IMPOSTAZIONI</p>
                <h3>Gestione sito</h3>
                <p>Modifica solo la sezione che ti serve e salva tutto con un solo pulsante.</p>
              </div>
            </div>

            {caricamentoImpostazioni ? (
              <p>Caricamento impostazioni...</p>
            ) : (
              <>
                <div className="admin-site-tabs" aria-label="Sezioni gestione sito">
                  {[
                    ['negozio', 'Negozio', '🏪'],
                    ['homepage', 'Homepage', '🏠'],
                    ['contatti', 'Contatti', '📞'],
                    ['offerta', 'Offerta', '🏷️'],
                    ['ordini', 'Ordini', '🕒'],
                  ].map(([id, etichetta, icona]) => (
                    <button
                      type="button"
                      key={id}
                      className={sezioneSitoAttiva === id ? 'active' : ''}
                      onClick={() => setSezioneSitoAttiva(id)}
                    >
                      <span>{icona}</span>
                      {etichetta}
                    </button>
                  ))}
                </div>

                {sezioneSitoAttiva === 'negozio' && (
                  <section className="admin-site-card">
                    <div className="admin-site-card-title">
                      <span>🏪</span>
                      <div>
                        <h4>Dati del negozio</h4>
                        <p>Le informazioni principali mostrate ai clienti.</p>
                      </div>
                    </div>

                    <div className="admin-site-grid two-columns">
                      <label>
                        Nome attività
                        <input
                          type="text"
                          value={impostazioni.business_name}
                          onChange={(evento) =>
                            aggiornaImpostazione('business_name', evento.target.value)
                          }
                        />
                      </label>

                      <label>
                        Sottotitolo
                        <input
                          type="text"
                          value={impostazioni.subtitle}
                          onChange={(evento) =>
                            aggiornaImpostazione('subtitle', evento.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Indirizzo
                      <input
                        type="text"
                        value={impostazioni.address}
                        onChange={(evento) =>
                          aggiornaImpostazione('address', evento.target.value)
                        }
                      />
                    </label>

                    <label>
                      Orari di apertura
                      <textarea
                        rows="3"
                        value={impostazioni.opening_hours}
                        onChange={(evento) =>
                          aggiornaImpostazione('opening_hours', evento.target.value)
                        }
                      />
                    </label>

                    <label>
                      Testo “Chi siamo”
                      <textarea
                        rows="5"
                        value={impostazioni.about_text}
                        onChange={(evento) =>
                          aggiornaImpostazione('about_text', evento.target.value)
                        }
                      />
                    </label>
                  </section>
                )}

                {sezioneSitoAttiva === 'homepage' && (
                  <section className="admin-site-card">
                    <div className="admin-site-card-title">
                      <span>🏠</span>
                      <div>
                        <h4>Testi della homepage</h4>
                        <p>Cambia il messaggio principale senza modificare il codice.</p>
                      </div>
                    </div>

                    <label>
                      Frase sopra il titolo
                      <input
                        type="text"
                        value={impostazioni.hero_subtitle}
                        onChange={(evento) =>
                          aggiornaImpostazione('hero_subtitle', evento.target.value)
                        }
                      />
                    </label>

                    <label>
                      Titolo principale
                      <input
                        type="text"
                        value={impostazioni.hero_title}
                        onChange={(evento) =>
                          aggiornaImpostazione('hero_title', evento.target.value)
                        }
                      />
                    </label>

                    <div className="admin-site-preview">
                      <small>ANTEPRIMA TESTO</small>
                      <span>{impostazioni.hero_subtitle || 'Frase introduttiva'}</span>
                      <strong>{impostazioni.hero_title || 'Titolo principale'}</strong>
                    </div>
                  </section>
                )}

                {sezioneSitoAttiva === 'contatti' && (
                  <section className="admin-site-card">
                    <div className="admin-site-card-title">
                      <span>📞</span>
                      <div>
                        <h4>Contatti e social</h4>
                        <p>Numeri e collegamenti utilizzati dai pulsanti del sito.</p>
                      </div>
                    </div>

                    <div className="admin-site-grid two-columns">
                      <label>
                        Telefono
                        <input
                          type="tel"
                          value={impostazioni.phone}
                          onChange={(evento) =>
                            aggiornaImpostazione('phone', evento.target.value)
                          }
                        />
                      </label>

                      <label>
                        Numero WhatsApp
                        <input
                          type="tel"
                          value={impostazioni.whatsapp}
                          onChange={(evento) =>
                            aggiornaImpostazione('whatsapp', evento.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Link Google Maps
                      <input
                        type="url"
                        placeholder="https://..."
                        value={impostazioni.maps_url}
                        onChange={(evento) =>
                          aggiornaImpostazione('maps_url', evento.target.value)
                        }
                      />
                    </label>

                    <div className="admin-site-grid two-columns">
                      <label>
                        Link Instagram
                        <input
                          type="url"
                          placeholder="https://..."
                          value={impostazioni.instagram_url}
                          onChange={(evento) =>
                            aggiornaImpostazione('instagram_url', evento.target.value)
                          }
                        />
                      </label>

                      <label>
                        Link Facebook
                        <input
                          type="url"
                          placeholder="https://..."
                          value={impostazioni.facebook_url}
                          onChange={(evento) =>
                            aggiornaImpostazione('facebook_url', evento.target.value)
                          }
                        />
                      </label>
                    </div>
                  </section>
                )}

                {sezioneSitoAttiva === 'ordini' && (
                  <section className="admin-site-card admin-orders-section">
                    <div className="admin-site-card-title">
                      <span>🕒</span>
                      <div>
                        <h4>Invio degli ordini</h4>
                        <p>I clienti possono inviare ordini a qualsiasi ora.</p>
                      </div>
                    </div>

                    <div className="admin-order-hours">
                      <div><span>Mattina</span><strong>08:00 – 13:00</strong></div>
                      <div><span>Pomeriggio</span><strong>17:00 – 20:00</strong></div>
                      <small>Queste fasce servono soltanto per scegliere l’orario di ritiro.</small>
                    </div>

                    <label className="admin-offer-switch admin-orders-switch">
                      <span>
                        <strong>Accetta ordini online</strong>
                        <small>Disattiva questo comando quando hai troppo lavoro. Il catalogo resterà comunque visibile.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={impostazioni.orders_enabled !== false}
                        onChange={(evento) =>
                          aggiornaImpostazione('orders_enabled', evento.target.checked)
                        }
                      />
                    </label>

                    <div className={impostazioni.orders_enabled !== false ? 'admin-orders-status active' : 'admin-orders-status paused'}>
                      <strong>{impostazioni.orders_enabled !== false ? 'ORDINI SEMPRE ATTIVI' : 'ORDINI SOSPESI MANUALMENTE'}</strong>
                      <span>
                        {impostazioni.orders_enabled !== false
                          ? 'Gli ordini sono sempre inviabili. Il cliente sceglie poi un orario di ritiro disponibile.'
                          : 'Nessun cliente potrà inviare ordini finché non riattivi il comando.'}
                      </span>
                    </div>
                  </section>
                )}

                {sezioneSitoAttiva === 'offerta' && (
                  <section className="admin-site-card admin-offer-section admin-offer-simple">
                    <div className="admin-site-card-title admin-offer-title-row">
                      <span>🏷️</span>
                      <div>
                        <h4>Offerta della settimana</h4>
                        <p>Scegli il prodotto e inserisci soltanto il nuovo prezzo.</p>
                      </div>
                    </div>

                    <label className="admin-offer-switch">
                      <span>
                        <strong>Mostra offerta sul sito</strong>
                        <small>Puoi spegnerla senza cancellare i dati.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={impostazioni.offer_enabled}
                        onChange={(evento) =>
                          aggiornaImpostazione('offer_enabled', evento.target.checked)
                        }
                      />
                    </label>

                    <label className="admin-offer-product-select">
                      1. Scegli il prodotto
                      <select
                        value={prodottoOffertaSelezionato}
                        onChange={(evento) => {
                          const id = evento.target.value
                          setProdottoOffertaSelezionato(id)
                          const prodotto = prodotti.find(
                            (elemento) => String(elemento.id) === id
                          )
                          if (!prodotto) return

                          setImpostazioni((attuali) => ({
                            ...attuali,
                            offer_title: 'OFFERTA DELLA SETTIMANA',
                            offer_product: prodotto.nome || '',
                            offer_original_price: `${Number(prodotto.prezzo)
                              .toFixed(2)
                              .replace('.', ',')} €/kg`,
                            offer_image_url: prodotto.immagine_url || '',
                          }))
                          setImmagineOfferta(null)
                        }}
                      >
                        <option value="">Seleziona un prodotto...</option>
                        {prodotti.map((prodotto) => (
                          <option key={prodotto.id} value={String(prodotto.id)}>
                            {prodotto.nome} — € {Number(prodotto.prezzo).toFixed(2).replace('.', ',')}/kg
                          </option>
                        ))}
                      </select>
                    </label>

                    {impostazioni.offer_product && (
                      <div className="admin-selected-offer-product">
                        <div className="admin-product-thumb">
                          {impostazioni.offer_image_url ? (
                            <img src={impostazioni.offer_image_url} alt={impostazioni.offer_product} />
                          ) : (
                            <span>🥩</span>
                          )}
                        </div>
                        <div>
                          <strong>{impostazioni.offer_product}</strong>
                          <span>Prezzo normale: {impostazioni.offer_original_price}</span>
                        </div>
                      </div>
                    )}

                    <label className="admin-offer-price-main">
                      2. Prezzo in offerta
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Es. 9,90 €/kg"
                        value={impostazioni.offer_price}
                        onChange={(evento) =>
                          aggiornaImpostazione('offer_price', evento.target.value)
                        }
                      />
                    </label>

                    <label>
                      3. Scadenza o nota (facoltativa)
                      <input
                        type="text"
                        placeholder="Es. Valida fino a sabato"
                        value={impostazioni.offer_note}
                        onChange={(evento) =>
                          aggiornaImpostazione('offer_note', evento.target.value)
                        }
                      />
                    </label>

                    {!modalitaRapida && (
                      <details className="admin-offer-advanced">
                        <summary>Opzioni avanzate</summary>
                        <label>
                          Titolo offerta
                          <input
                            type="text"
                            value={impostazioni.offer_title}
                            onChange={(evento) =>
                              aggiornaImpostazione('offer_title', evento.target.value)
                            }
                          />
                        </label>
                        <label>
                          Cambia immagine manualmente
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={caricamentoImmagineOfferta}
                            onChange={(evento) =>
                              setImmagineOfferta(evento.target.files?.[0] || null)
                            }
                          />
                        </label>
                      </details>
                    )}

                    <div className="admin-offer-preview">
                      <small>ANTEPRIMA</small>
                      <strong>{impostazioni.offer_title || 'OFFERTA DELLA SETTIMANA'}</strong>
                      <span>{impostazioni.offer_product || 'Scegli un prodotto'}</span>
                      <div>
                        {impostazioni.offer_original_price && (
                          <del>{impostazioni.offer_original_price}</del>
                        )}
                        <b>{impostazioni.offer_price || 'Inserisci il prezzo'}</b>
                      </div>
                      {impostazioni.offer_note && <em>{impostazioni.offer_note}</em>}
                    </div>
                  </section>
                )}

                <div className="admin-site-savebar">
                  <span>
                    Le modifiche diventano visibili sul sito dopo il salvataggio.
                  </span>
                  <button
                    type="button"
                    className="admin-add"
                    disabled={salvataggioImpostazioni}
                    onClick={salvaImpostazioni}
                  >
                    {salvataggioImpostazioni
                      ? 'SALVATAGGIO...'
                      : 'SALVA MODIFICHE'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="admin-close"
          onClick={onClose}
        >
          SALVA E CHIUDI
        </button>

        <button
          className="admin-logout"
          onClick={esciAdmin}
        >
          ESCI DALL’ADMIN
        </button>
      </section>
    </div>
  )
}

export default AdminPanel