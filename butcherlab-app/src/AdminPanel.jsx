import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const prodottoVuoto = {
  nome: '',
  descrizione: '',
  prezzo: '',
  categoria: 'Preparati',
  simbolo: '🥩',
  immagine_url: '',
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
offer_price: '',
offer_note: '',
}

function AdminPanel({ prodotti, setProdotti, onClose }) {
  const [sezioneAttiva, setSezioneAttiva] =
    useState('catalogo')

  const [nuovoProdotto, setNuovoProdotto] =
    useState(prodottoVuoto)

  const [
    immagineNuovoProdotto,
    setImmagineNuovoProdotto,
  ] = useState(null)

  const [caricamentoImmagine, setCaricamentoImmagine] =
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
offer_price: impostazioni.offer_price.trim(),
offer_note: impostazioni.offer_note.trim(),
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
      return
    }

    const prodottoDaSalvare = {
      nome: nuovoProdotto.nome.trim(),
      descrizione: nuovoProdotto.descrizione.trim(),
      prezzo: Number(nuovoProdotto.prezzo),
      categoria: nuovoProdotto.categoria,
      simbolo: nuovoProdotto.simbolo || '🥩',
      immagine_url: '',
    }

    const { data, error } = await supabase
      .from('prodotti')
      .insert(prodottoDaSalvare)
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Errore durante il salvataggio del prodotto')
      return
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

        {sezioneAttiva === 'catalogo' && (
          <>
            <div className="admin-products">
              {prodotti.map((prodotto) => (
                <article
                  className="admin-product-edit"
                  key={prodotto.id}
                >
                  {prodotto.immagine_url && (
                    <img
                      src={prodotto.immagine_url}
                      alt={prodotto.nome}
                      className="admin-product-image"
                    />
                  )}

                  <label>
                    Foto prodotto
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

                  <div className="admin-row">
                    <input
                      type="text"
                      value={prodotto.simbolo || ''}
                      placeholder="Emoji"
                      onChange={(evento) =>
                        modificaProdotto(
                          prodotto.id,
                          'simbolo',
                          evento.target.value
                        )
                      }
                    />

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
                    <option>Cavallo</option>
                    <option>Pollo</option>
                    <option>Maiale</option>
                    <option>Preparati</option>
                  </select>

                  <button
                    className="admin-delete"
                    onClick={() =>
                      eliminaProdotto(prodotto.id)
                    }
                  >
                    ELIMINA PRODOTTO
                  </button>
                </article>
              ))}
            </div>

            <div className="admin-new-product">
              <h3>AGGIUNGI PRODOTTO</h3>

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

              <textarea
                placeholder="Descrizione"
                value={nuovoProdotto.descrizione}
                onChange={(evento) =>
                  setNuovoProdotto({
                    ...nuovoProdotto,
                    descrizione: evento.target.value,
                  })
                }
              />

              <div className="admin-row">
                <input
                  type="text"
                  placeholder="Emoji"
                  value={nuovoProdotto.simbolo}
                  onChange={(evento) =>
                    setNuovoProdotto({
                      ...nuovoProdotto,
                      simbolo: evento.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="Prezzo"
                  value={nuovoProdotto.prezzo}
                  onChange={(evento) =>
                    setNuovoProdotto({
                      ...nuovoProdotto,
                      prezzo: evento.target.value,
                    })
                  }
                />
              </div>

              <select
                value={nuovoProdotto.categoria}
                onChange={(evento) =>
                  setNuovoProdotto({
                    ...nuovoProdotto,
                    categoria: evento.target.value,
                  })
                }
              >
                <option>Cavallo</option>
                <option>Pollo</option>
                <option>Maiale</option>
                <option>Preparati</option>
              </select>

              <button
                className="admin-add"
                disabled={caricamentoImmagine}
                onClick={aggiungiProdotto}
              >
                {caricamentoImmagine
                  ? 'CARICAMENTO FOTO...'
                  : '+ AGGIUNGI AL CATALOGO'}
              </button>
            </div>
          </>
        )}

        {sezioneAttiva === 'impostazioni' && (
          <div className="admin-settings">
            <h3>GESTIONE SITO</h3>

            {caricamentoImpostazioni ? (
              <p>Caricamento impostazioni...</p>
            ) : (
              <>
                <label>
                  Nome attività
                  <input
                    type="text"
                    value={impostazioni.business_name}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'business_name',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Sottotitolo
                  <input
                    type="text"
                    value={impostazioni.subtitle}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'subtitle',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Titolo principale homepage
                  <input
                    type="text"
                    value={impostazioni.hero_title}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'hero_title',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Frase sopra il titolo
                  <input
                    type="text"
                    value={impostazioni.hero_subtitle}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'hero_subtitle',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Indirizzo
                  <input
                    type="text"
                    value={impostazioni.address}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'address',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Telefono
                  <input
                    type="tel"
                    value={impostazioni.phone}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'phone',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Numero WhatsApp
                  <input
                    type="tel"
                    value={impostazioni.whatsapp}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'whatsapp',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Orari di apertura
                  <textarea
                    value={impostazioni.opening_hours}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'opening_hours',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Testo “Chi siamo”
                  <textarea
                    value={impostazioni.about_text}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'about_text',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Link Google Maps
                  <input
                    type="url"
                    placeholder="https://..."
                    value={impostazioni.maps_url}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'maps_url',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Link Instagram
                  <input
                    type="url"
                    placeholder="https://..."
                    value={impostazioni.instagram_url}
                    onChange={(evento) =>
                      aggiornaImpostazione(
                        'instagram_url',
                        evento.target.value
                      )
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
                      aggiornaImpostazione(
                        'facebook_url',
                        evento.target.value
                      )
                    }
                  />
                </label>
                <div className="admin-offer-section">
  <h4>OFFERTA DELLA SETTIMANA</h4>

  <label className="admin-checkbox">
    <input
      type="checkbox"
      checked={impostazioni.offer_enabled}
      onChange={(evento) =>
        aggiornaImpostazione(
          'offer_enabled',
          evento.target.checked
        )
      }
    />
    Mostra offerta sul sito
  </label>

  <label>
    Titolo offerta
    <input
      type="text"
      value={impostazioni.offer_title}
      onChange={(evento) =>
        aggiornaImpostazione(
          'offer_title',
          evento.target.value
        )
      }
    />
  </label>

  <label>
    Prodotto
    <input
      type="text"
      placeholder="Es. Hamburger di cavallo"
      value={impostazioni.offer_product}
      onChange={(evento) =>
        aggiornaImpostazione(
          'offer_product',
          evento.target.value
        )
      }
    />
  </label>

  <label>
    Prezzo
    <input
      type="text"
      placeholder="Es. 11,90 €/kg"
      value={impostazioni.offer_price}
      onChange={(evento) =>
        aggiornaImpostazione(
          'offer_price',
          evento.target.value
        )
      }
    />
  </label>

  <label>
    Nota
    <input
      type="text"
      placeholder="Es. Valida fino a sabato"
      value={impostazioni.offer_note}
      onChange={(evento) =>
        aggiornaImpostazione(
          'offer_note',
          evento.target.value
        )
      }
    />
  </label>
</div>
                <button
                  type="button"
                  className="admin-add"
                  disabled={salvataggioImpostazioni}
                  onClick={salvaImpostazioni}
                >
                  {salvataggioImpostazioni
                    ? 'SALVATAGGIO...'
                    : 'SALVA IMPOSTAZIONI'}
                </button>
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