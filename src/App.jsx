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
import Servicos from "./pages/admin/Servicos"
import Funcionamento from "./pages/admin/Funcionamento"
import Feriados from "./pages/admin/Feriados"
import Caixa from "./pages/admin/Caixa"
import { initOneSignal } from "./lib/onesignal"

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initOneSignal()

    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/barbeiro" element={<Barbeiro />} />
        <Route path="/data" element={<Data />} />
        <Route path="/sucesso" element={<Sucesso />} />
        <Route path="/cliente" element={<Cliente />} />
        <Route path="/confirmar" element={<Confirmar />} />
        <Route path="/cancelar" element={<Cancelar />} />
        <Route path="/cancelarCliente" element={<CancelarCliente />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/perfil" element={<Perfil />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/agenda"
          element={
            <AdminRoute>
              <Agenda />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/servicos"
          element={
            <AdminRoute>
              <Servicos />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/caixa"
          element={
            <AdminRoute>
              <Caixa />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/funcionamento"
          element={
            <AdminRoute>
              <Funcionamento />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/feriados"
          element={
            <AdminRoute>
              <Feriados />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App