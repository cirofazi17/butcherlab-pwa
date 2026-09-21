import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Categoria from './pages/Categoria.jsx'
import LaunchExperience from './LaunchExperience.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
 <BrowserRouter>
  <LaunchExperience />
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/categoria/:nome" element={<Categoria />} />
  </Routes>
</BrowserRouter>
</StrictMode>
)
