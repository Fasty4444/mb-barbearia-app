import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"
import { obterHorariosPorData } from "../utils/horarios"

function formatarHojeLocal() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

export default function Data() {
  const navigate = useNavigate()
  const location = useLocation()

  const { servico, barbeiro } = location.state || {}

  const hojeFormatado = formatarHojeLocal()

  const [date, setDate] = useState(hojeFormatado)
  const [horariosOcupados, setHorariosOcupados] = useState([])
  const [diaBloqueado, setDiaBloqueado] = useState(false)
  const [horariosBase, setHorariosBase] = useState([])

  useEffect(() => {
    async function carregarHorarios() {
      const lista = await obterHorariosPorData(date)
      setHorariosBase(lista)
    }

    carregarHorarios()
  }, [date])

  function horaParaMinutos(hora) {
    const [h, m] = hora.split(":").map(Number)
    return h * 60 + m
  }

  function bloquearPorDuracao(horarios, ocupados) {
    const bloqueados = new Set()

    ocupados.forEach((item) => {
      if (!item?.horario) return

      if (item.tipo === "bloqueio_manual") {
        bloqueados.add(item.horario)
        return
      }

      const inicio = horaParaMinutos(item.horario)
      const fim = inicio + (item.duracao || 30)

      horarios.forEach((h) => {
        const atual = horaParaMinutos(h)

        if (atual >= inicio && atual < fim) {
          bloqueados.add(h)
        }
      })
    })

    return horarios.filter(h => !bloqueados.has(h))
  }

  function criarDataLocal(dataString) {
    const [ano, mes, dia] = dataString.split("-").map(Number)
    return new Date(ano, mes - 1, dia)
  }

  function horarioPassado(data, horario) {
    const agora = new Date()
    const [ano, mes, dia] = data.split("-")
    const dataSelecionada = new Date(ano, mes - 1, dia)

    const [hora, minuto] = horario.split(":")
    dataSelecionada.setHours(hora, minuto, 0, 0)

    return dataSelecionada < agora
  }

  useEffect(() => {
    if (!servico || !barbeiro) {
      navigate("/agendamento")
    }
  }, [])

  useEffect(() => {
    async function carregar() {
      let query = supabase
        .from("agendamentos")
        .select("horario, servico_id, servicos(duracao)")
        .eq("data", date)
        .neq("status", "cancelado")

      if (barbeiro?.id) {
        query = query.eq("barbeiro_id", barbeiro.id)
      }

      const { data, error } = await query

      if (error) {
        console.log(error)
        return
      }

      const { data: bloqueados } = await supabase
        .from("bloqueios_horarios")
        .select("horario")
        .eq("data", date)

      const ocupados = data?.map(i => ({
        horario: i.horario,
        duracao: i.servicos?.duracao || 30,
        tipo: "agendamento"
      })) || []

      const bloqueadosLista = bloqueados?.map(i => ({
        horario: i.horario,
        duracao: 0,
        tipo: "bloqueio_manual"
      })) || []

      setHorariosOcupados([...ocupados, ...bloqueadosLista])
    }

    carregar()
  }, [date, barbeiro?.id])

  useEffect(() => {
    async function verificarTudo() {
      const bloqueado = await verificarBloqueio(date)
      const feriado = await verificarFeriado(date)

      setDiaBloqueado(bloqueado || feriado)
    }

    verificarTudo()
  }, [date])

  async function verificarBloqueio(dataSelecionada) {
    const { data } = await supabase
      .from("bloqueios")
      .select("*")
      .eq("data", dataSelecionada)

    return data.length > 0
  }

  async function verificarFeriado(dataSelecionada) {
    const { data } = await supabase
      .from("feriados")
      .select("*")
      .eq("data", dataSelecionada)
      .eq("ativo", true)

    return data.length > 0
  }

  function filtrarHorariosPassados(horarios) {
    const agora = new Date()
    const dataSelecionada = criarDataLocal(date)
    const mesmoDia = agora.toDateString() === dataSelecionada.toDateString()

    if (!mesmoDia) return horarios

    return horarios.filter((hora) => {
      const [h, m] = hora.split(":")
      const horarioData = criarDataLocal(date)

      horarioData.setHours(parseInt(h))
      horarioData.setMinutes(parseInt(m))
      horarioData.setSeconds(0)

      return horarioData > agora
    })
  }

  function obterDisponiveis() {
    const base = filtrarHorariosPassados(horariosBase)
    const livres = base.filter(h => !horariosOcupados.some(o => o.horario === h))
    return bloquearPorDuracao(livres, horariosOcupados)
  }

  const domingo = criarDataLocal(date).getDay() === 0
  const horarios = diaBloqueado ? [] : obterDisponiveis()

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full p-6"
      >
        <button
          onClick={() => navigate("/agendamento")}
          className="text-zinc-400 hover:text-white mb-4"
        >
          ← Voltar
        </button>

        <div className="flex justify-between mb-8 text-sm text-zinc-500">
          <span>1. Serviço</span>

          <span className="text-yellow-500 font-semibold">
            2. Horário
          </span>

          <span>3. Dados</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-6">
          Escolha a data
        </h1>

        <div className="w-full flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-8 gap-2">
          <span className="text-yellow-500 font-semibold">
            Data:
          </span>

          <input
            type="date"
            value={date}
            min={hojeFormatado}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent outline-none text-white flex-1"
          />
        </div>

        {domingo && (
          <p className="text-center text-red-500 mb-6">
            Barbearia fechada aos domingos
          </p>
        )}

        {diaBloqueado && (
          <p className="text-center text-red-500 mb-6">
            Este dia está indisponível ❌
          </p>
        )}

        {!domingo && (
          <>
            <h2 className="text-center mb-6">
              Horários vagos para {criarDataLocal(date).toLocaleDateString("pt-BR")}
            </h2>

            {horarios.length === 0 ? (
              <p className="text-center text-zinc-400">
                Todos os horários estão ocupados
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {horarios.map((hora) => {
                  const bloqueado = diaBloqueado || horarioPassado(date, hora)

                  return (
                    <motion.button
                      key={hora}
                      whileTap={{ scale: 0.9 }}
                      disabled={bloqueado}
                      onClick={() => {
                        if (bloqueado) return

                        navigate("/cliente", {
                          state: {
                            servico,
                            barbeiro,
                            data: date,
                            horario: hora
                          }
                        })
                      }}
                      className={`p-4 rounded-xl border transition ${
                        bloqueado
                          ? "bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed"
                          : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
                      }`}
                    >
                      {hora}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}