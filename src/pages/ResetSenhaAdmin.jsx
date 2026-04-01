import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function ResetSenhaAdmin() {
  const navigate = useNavigate()

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function handleReset(e) {
    e.preventDefault()
    setErro("")
    setMensagem("")

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.")
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) {
      setErro(error.message || "Não foi possível redefinir a senha.")
      setLoading(false)
      return
    }

    setMensagem("Senha alterada com sucesso. Redirecionando para o login...")

    setTimeout(() => {
      navigate("/login-admin", { replace: true })
    }, 1800)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Redefinir senha
        </h1>

        <p className="text-zinc-400 text-center mb-6">
          Digite sua nova senha para acessar novamente o painel
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Nova senha
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha"
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Confirme a nova senha"
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 outline-none"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl p-3">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  )
}