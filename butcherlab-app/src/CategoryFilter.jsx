const categorie = [
      'Tutti',
        'Cavallo',
          'Pollo',
            'Maiale',
              'Preparati',
              'Box',
              ]

              function CategoryFilter({ categoriaAttiva, onChange }) {
                return (
                    <div className="category-filter">
                          {categorie.map((categoria) => (
                                  <button
                                            key={categoria}
                                                      className={
                                                                  categoriaAttiva === categoria
                                                                                ? 'category-button active'
                                                                                              : 'category-button'
                                                                                                        }
                                                                                                                  onClick={() => onChange(categoria)}
                                                                                                                          >
                                                                                                                                    {categoria}
                                                                                                                                            </button>
                                                                                                                                                  ))}
                                                                                                                                                      </div>
                                                                                                                                                        )
                                                                                                                                                        }

                                                                                                                                                        export default CategoryFilter