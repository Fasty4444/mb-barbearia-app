import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export default function Historico() {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [telefone, setTelefone] = useState("")
  const [precisaTelefone, setPrecisaTelefone] = useState(false)
  const [erro, setErro] = useState("")
  const navigate = useNavigate()

  function formatarData(data) {
    if (!data) return ""
    const [ano, mes, dia] = data.split("-")
    return `${dia}/${mes}/${ano}`
  }

  async function buscarHistorico(telefoneInput) {
    setLoading(true)
    setErro("")
    setAgendamentos([])

    const telefoneLimpo = telefoneInput.trim()

    if (!telefoneLimpo) {
      setErro("Digite seu telefone para ver seu histórico.")
      setLoading(false)
      return
    }

    // 1. Buscar cliente pelo telefone
    const { data: cliente, error: erroCliente } = await supabase
      .from("clientes")
      .select("*")
      .eq("telefone", telefoneLimpo)
      .single()

    if (erroCliente || !cliente) {
      setErro("Cliente não encontrado para esse telefone.")
      setLoading(false)
      return
    }

    // 2. Buscar agendamentos pelo cliente_id
    const { data, error } = await supabase
      .from("agendamentos")
      .select(`
        *,
        servicos (nome),
        barbeiros (nome)
      `)
      .eq("cliente_id", cliente.id)
      .order("data", { ascending: false })

    if (error) {
      setErro("Erro ao buscar histórico.")
      setLoading(false)
      return
    }

    setAgendamentos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    const telefoneSalvo = localStorage.getItem("cliente_telefone")

    if (!telefoneSalvo) {
      setPrecisaTelefone(true)
      setLoading(false)
      return
    }

    setTelefone(telefoneSalvo)
    buscarHistorico(telefoneSalvo)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => navigate("/")}
        className="text-zinc-400 mb-6"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Meu histórico
      </h1>

      {precisaTelefone && (
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 mb-3">
            Digite seu telefone para ver seu histórico:
          </p>

          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Seu telefone"
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 mb-3 outline-none focus:border-yellow-500"
          />

          <button
            onClick={() => {
              localStorage.setItem("cliente_telefone", telefone)
              setPrecisaTelefone(false)
              buscarHistorico(telefone)
            }}
            className="w-full bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition font-medium"
          >
            Buscar histórico
          </button>
        </div>
      )}

      {loading && (
        <p className="text-zinc-400">Carregando...</p>
      )}

      {!loading && erro && (
        <p className="text-red-400 mb-4">{erro}</p>
      )}

      {!loading && !erro && agendamentos.length === 0 && (
        <p className="text-zinc-400">
          Nenhum agendamento encontrado.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {agendamentos.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-zinc-900 to-black p-5 rounded-2xl border border-zinc-800 shadow-lg"
          >
            <div className="flex justify-between items-center mb-3 gap-3">
              <p className="text-yellow-500 font-semibold">
                {formatarData(item.data)}
              </p>

              <span
                className={`text-xs px-3 py-1 rounded-full capitalize ${
                  item.status === "confirmado"
                    ? "bg-green-500/20 text-green-400"
                    : item.status === "cancelado"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-700/40 text-zinc-300"
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-lg font-bold">
              {item.horario}
            </p>

            <p className="text-zinc-400 text-sm mt-1">
              {item.servicos?.nome || "Serviço não encontrado"}
            </p>

            <p className="text-zinc-500 text-xs mt-2">
              com {item.barbeiros?.nome || "Barbeiro não encontrado"}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}