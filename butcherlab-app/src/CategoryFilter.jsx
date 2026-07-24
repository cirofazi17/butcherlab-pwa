import cavalloImg from './assets/categories/cavallo.png'
import polloImg from './assets/categories/pollo.png'
import maialeImg from './assets/categories/maiale.png'
import preparatiImg from './assets/categories/preparati.png'
import boxImg from './assets/categories/box.png'
const categorie = [
  {
    nome: 'Tutti',
    icona: 'TUTTI',
  },
  {
    nome: 'Cavallo',
    immagine: cavalloImg,
  },
  {
    nome: 'Pollo',
    immagine: polloImg,
  },
  {
    nome: 'Maiale',
    immagine: maialeImg,
  },
  {
    nome: 'Preparati',
    immagine: preparatiImg,
  },
  {
    nome: 'Box',
    immagine: boxImg,
  },
]

              function CategoryFilter({ categoriaAttiva, onChange }) {
                return (
                    <div className="category-filter">
                          {categorie.map((categoria) => (
                                  <button
                                            key={categoria.nome}
                                                      className={
                                                                  categoriaAttiva === categoria.nome
                                                                                ? 'category-button active'
                                                                                              : 'category-button'
                                                                                                        }
                                                                                                                  onClick={() => onChange(categoria.nome)}
                                                                                                                          >
                                                                                             <div className="category-card">
  {categoria.immagine ? (
    <img
      src={categoria.immagine}
      alt={categoria.nome}
      className="category-image"
    />
  ) : (
    <span className="category-icon">
      {categoria.icona}
    </span>
  )}


</div>
                                                                                                                                            </button>
                                                                                                                                                  ))}
                                                                                                                                                      </div>
                                                                                                                                                        )
                                                                                                                                                        }

                                                                                                                                                        export default CategoryFilter