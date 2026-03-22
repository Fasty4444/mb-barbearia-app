import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import Barbeiro from "./pages/Barbeiro"
import Data from "./pages/Data"
import Home from "./pages/Home"
import Agendamento from "./pages/Agendamento"
import LoadingScreen from "./components/LoadingScreen"
import Admin from "./pages/admin/Admin"
import AdminRoute from "./components/AdminRoute"
import Agenda from "./pages/admin/Agenda"
import Dashboard from "./pages/admin/Dashboard"
import Sucesso from "./pages/Sucesso"
import Cliente from "./pages/Cliente"
import Confirmar from "./pages/Confirmar"
import Cancelar from "./pages/Cancelar"
import CancelarCliente from "./pages/CancelarCliente"
import Historico from "./pages/Historico"
import Perfil from "./pages/Perfil"

function App() {

  const [loading, setLoading] = useState(true)

  useEffect(() => {

    setTimeout(() => {
      setLoading(false)
    }, 1500)

  }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/barbeiro" element={<Barbeiro />} />
        <Route path="/data" element={<Data />} />
        <Route 
  path="/admin" 
  element={
    <AdminRoute>
      <Admin />
    </AdminRoute>
  } 
/>
        <Route path="/admin/agenda" element={<Agenda />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/sucesso" element={<Sucesso />} />
        <Route path="/cliente" element={<Cliente />} />
        <Route path="/confirmar" element={<Confirmar />} />
        <Route path="/cancelar" element={<Cancelar />} />
        <Route path="/cancelarCliente" element={<CancelarCliente />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/perfil" element={<Perfil />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App