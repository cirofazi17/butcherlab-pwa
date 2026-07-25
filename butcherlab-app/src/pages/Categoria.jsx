import { useNavigate, useParams } from "react-router-dom";

export default function Categoria() {
  const { nome } = useParams();
  const navigate = useNavigate();

  return (
    <main className="catalogo">
      <button
        className="hero-button"
        onClick={() => navigate("/")}
      >
        ← Torna alle categorie
      </button>

      <h2 style={{ marginTop: 30 }}>
        {nome.toUpperCase()}
      </h2>

      <p>Pagina categoria in costruzione...</p>
    </main>
  );
}