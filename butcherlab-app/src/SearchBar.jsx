function SearchBar({ valore, onChange }) {
      return (
          <div className="search-box">
                <span>🔎</span>

                      <input
                              type="search"
                                      value={valore}
                                              onChange={(evento) => onChange(evento.target.value)}
                                                      placeholder="Cerca hamburger, pollo, salsiccia..."
                                                            />
                                                                </div>
                                                                  )
                                                                  }

                                                                  export default SearchBar
