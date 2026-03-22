import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export default function Perfil(){

const [cliente, setCliente] = useState(null)
const [proximo, setProximo] = useState(null)
const [ultimo, setUltimo] = useState(null)
const [diasSemCorte, setDiasSemCorte] = useState(null)
const [loading, setLoading] = useState(true)

const navigate = useNavigate()

function formatarData(data){
  if(!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

useEffect(() => {
  async function carregarPerfil(){

    const telefone = localStorage.getItem("cliente_telefone")

    if(!telefone){
      setLoading(false)
      return
    }

    // 🔥 buscar cliente
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("*")
      .eq("telefone", telefone)
      .single()

    if(!clienteData){
      setLoading(false)
      return
    }

    setCliente(clienteData)

    // 🔥 buscar agendamentos
    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select(`
        *,
        servicos (nome),
        barbeiros (nome)
      `)
      .eq("cliente_id", clienteData.id)

    if(!agendamentos){
      setLoading(false)
      return
    }

    // 🔥 ordenar por data
    const ordenados = [...agendamentos].sort((a,b)=> new Date(a.data) - new Date(b.data))

    const hoje = new Date()
    hoje.setHours(0,0,0,0)

    // 🔥 próximo agendamento (CORRIGIDO)
    const proximoAgendamento = ordenados.find(a => {
      const dataAgendamento = new Date(a.data)
      dataAgendamento.setHours(0,0,0,0)

      return dataAgendamento >= hoje && a.status === "confirmado"
    })

    setProximo(proximoAgendamento || null)

    // 🔥 último corte (CORRIGIDO)
    const passado = ordenados.filter(a => {
      const dataAgendamento = new Date(a.data)
      dataAgendamento.setHours(0,0,0,0)

      return dataAgendamento < hoje
    })

    const ultimoCorte = passado[passado.length - 1]

    setUltimo(ultimoCorte || null)

    // 🔥 calcular dias sem cortar
    if(ultimoCorte){
      const dataUltimo = new Date(ultimoCorte.data)
      dataUltimo.setHours(0,0,0,0)

      const diff = Math.floor((hoje - dataUltimo) / (1000 * 60 * 60 * 24))
      setDiasSemCorte(diff)
    }

    setLoading(false)
  }

  carregarPerfil()
}, [])

return(

<div className="min-h-screen bg-black text-white p-6">

  <button
    onClick={()=>navigate("/")}
    className="text-zinc-400 mb-6"
  >
    ← Voltar
  </button>

  <h1 className="text-2xl font-bold mb-6">
    Meu perfil
  </h1>

  {loading && (
    <p className="text-zinc-400">Carregando...</p>
  )}

  {!loading && cliente && (

    <div className="flex flex-col gap-6">

      {/* 👤 CLIENTE */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"
      >
        <p className="text-lg font-bold">{cliente.nome}</p>
        <p className="text-zinc-400 text-sm">{cliente.telefone}</p>
      </motion.div>

      {/* 📅 PRÓXIMO */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="bg-gradient-to-br from-zinc-900 to-black p-5 rounded-2xl border border-zinc-800"
      >
        <p className="text-yellow-500 font-semibold mb-3">
          Próximo agendamento
        </p>

        {proximo ? (
          <>
            <p>{formatarData(proximo.data)}</p>
            <p>{proximo.horario}</p>
            <p className="text-zinc-400 text-sm">
              {proximo.servicos?.nome}
            </p>
            <p className="text-zinc-500 text-xs">
              com {proximo.barbeiros?.nome}
            </p>
          </>
        ) : (
          <p className="text-zinc-400">
            Você não tem agendamento marcado.
          </p>
        )}
      </motion.div>

      {/* ⏳ STATUS */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"
      >
        <p className="text-yellow-500 font-semibold mb-2">
          Seu status
        </p>

        {diasSemCorte !== null ? (
          <p>
            Você está há <span className="text-yellow-500 font-bold">{diasSemCorte}</span> dias sem cortar ✂️
          </p>
        ) : (
          <p className="text-zinc-400">
            Ainda não há histórico suficiente.
          </p>
        )}
      </motion.div>

      {/* 🔔 NOTIFICAÇÕES */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"
      >
        <p className="text-yellow-500 font-semibold mb-2">
          Notificações
        </p>

        {proximo ? (
          <p>
            Você já tem um horário marcado em{" "}
            <span className="text-yellow-500 font-bold">
              {formatarData(proximo.data)}
            </span> 🔥
          </p>
        ) : diasSemCorte !== null ? (
          <p>
            Você está há{" "}
            <span className="text-yellow-500 font-bold">
              {diasSemCorte}
            </span>{" "}
            dias sem cortar 😎
          </p>
        ) : (
          <p className="text-zinc-400">
            Sem notificações no momento.
          </p>
        )}
      </motion.div>

      {/* 📊 HISTÓRICO */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"
      >
        <p className="text-yellow-500 font-semibold mb-3">
          Histórico
        </p>

        {ultimo ? (
          <>
            <p>Último corte: {formatarData(ultimo.data)}</p>
          </>
        ) : (
          <p className="text-zinc-400">
            Nenhum corte registrado.
          </p>
        )}
      </motion.div>

      {/* 💬 CONTATO */}
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
      >
        <a
          href="https://wa.me/5567996609283"
          target="_blank"
          className="block text-center bg-green-500 hover:bg-green-600 text-black py-3 rounded-xl font-medium transition"
        >
          💬 Falar no WhatsApp
        </a>
      </motion.div>

    </div>

  )}

</div>

)

}