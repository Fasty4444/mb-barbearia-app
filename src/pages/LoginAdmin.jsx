import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function LoginAdmin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    verificarSessao()
  }, [])

  async function verificarSessao() {
    const { data } = await supabase.auth.getSession()

    if (data?.session) {
      navigate("/admin", { replace: true })
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) {
      setErro("E-mail ou senha incorretos.")
      setLoading(false)
      return
    }

    navigate("/admin", { replace: true })
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Área do barbeiro
        </h1>

        <p className="text-zinc-400 text-center mb-6">
          Faça login para acessar o painel admin
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 outline-none"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}