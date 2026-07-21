import { useState } from 'react'
import { supabase } from './supabase'

const prodottoVuoto = {
  nome: '',
  descrizione: '',
  prezzo: '',
  categoria: 'Preparati',
  simbolo: '🥩',
  immagine_url: '',
}

function AdminPanel({ prodotti, setProdotti, onClose }) {
  const [nuovoProdotto, setNuovoProdotto] =
    useState(prodottoVuoto)

  const [immagineNuovoProdotto, setImmagineNuovoProdotto] =
    useState(null)

  const [caricamentoImmagine, setCaricamentoImmagine] =
    useState(false)

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
            <h2>GESTIONE CATALOGO</h2>
          </div>

          <button onClick={onClose}>×</button>
        </div>

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