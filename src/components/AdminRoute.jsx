import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    verificarSessao()
  }, [])

  async function verificarSessao() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      setAutorizado(false)
      setLoading(false)
      return
    }

    if (data?.session) {
      setAutorizado(true)
    } else {
      setAutorizado(false)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="bg-zinc-900 p-8 rounded-xl w-[300px] text-center">
          <h2 className="text-xl mb-2">Verificando acesso...</h2>
          <p className="text-zinc-400 text-sm">
            Aguarde um instante
          </p>
        </div>
      </div>
    )
  }

  if (!autorizado) {
    return <Navigate to="/login-admin" replace />
  }

  return children
}