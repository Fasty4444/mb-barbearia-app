import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

function formatarDataLocal(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

export default function Agenda() {
  const [agenda, setAgenda] = useState([])
  const [barbeiros, setBarbeiros] = useState([])
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null)
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [filtroStatus, setFiltroStatus] = useState("ativo")

  const horarios = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30",
    "15:00", "15:30"
  ]

  useEffect(() => {
    carregarBarbeiros()
  }, [])

  useEffect(() => {
    if (barbeiroSelecionado) {
      carregarAgenda()
    }
  }, [barbeiroSelecionado, dataSelecionada])

  async function carregarBarbeiros() {
    const { data } = await supabase
      .from("barbeiros")
      .select("*")

    if (data) {
      setBarbeiros(data)
      setBarbeiroSelecionado(data[0])
    }
  }

  async function carregarAgenda() {
    const dataFormatada = formatarDataLocal(dataSelecionada)

    const { data } = await supabase
      .from("agendamentos")
      .select(`
        id,
        horario,
        status,
        clientes(nome),
        servicos(nome)
      `)
      .eq("barbeiro_id", barbeiroSelecionado.id)
      .eq("data", dataFormatada)

    const agendaCompleta = horarios.map(hora => {
      const agendamento = data?.find(a => a.horario === hora)

      return {
        horario: hora,
        agendamento
      }
    })

    setAgenda(agendaCompleta)
  }

  async function cancelarAgendamento(id) {
    const confirmar = confirm("Cancelar agendamento?")
    if (!confirmar) return

    await supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", id)

    carregarAgenda()
  }

  function proximoDia() {
    const novaData = new Date(dataSelecionada)
    novaData.setDate(novaData.getDate() + 1)
    setDataSelecionada(novaData)
  }

  function diaAnterior() {
    const novaData = new Date(dataSelecionada)
    novaData.setDate(novaData.getDate() - 1)
    setDataSelecionada(novaData)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">
        Agenda
      </h1>

      <select
        value={barbeiroSelecionado?.id || ""}
        onChange={(e) => {
          const b = barbeiros.find(x => x.id === e.target.value)
          setBarbeiroSelecionado(b)
        }}
        className="bg-zinc-900 p-3 rounded mb-4"
      >
        {barbeiros.map(b => (
          <option key={b.id} value={b.id}>
            {b.nome}
          </option>
        ))}
      </select>

      <select
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
        className="bg-zinc-900 p-3 rounded mb-6 ml-4"
      >
        <option value="ativo">Ativos</option>
        <option value="cancelado">Cancelados</option>
      </select>

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={diaAnterior}
          className="bg-zinc-800 px-4 py-2 rounded"
        >
          ←
        </button>

        <span className="text-lg font-bold">
          {dataSelecionada.toLocaleDateString("pt-BR")}
        </span>

        <button
          onClick={proximoDia}
          className="bg-zinc-800 px-4 py-2 rounded"
        >
          →
        </button>
      </div>

      <h2 className="text-xl mb-6">
        Agenda de {barbeiroSelecionado?.nome}
      </h2>

      <div className="grid gap-4 max-w-2xl">
        {agenda
          .filter(item => {
            const status = item.agendamento?.status

            if (filtroStatus === "cancelado") {
              return status === "cancelado"
            }

            return status !== "cancelado"
          })
          .map((item, index) => {
            const ag = item.agendamento

            return (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="w-20 text-lg font-bold">
                  {item.horario}
                </div>

                {ag ? (
                  <div
                    className={`flex-1 p-4 rounded-xl shadow-lg flex justify-between items-center ${
                      ag.status === "cancelado"
                        ? "bg-red-900 text-white"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    <div>
                      <div className="font-bold">
                        {ag.clientes?.nome}
                      </div>

                      <div className="text-sm">
                        {ag.servicos?.nome}
                      </div>

                      {ag.status === "cancelado" && (
                        <div className="text-xs mt-1 text-red-300">
                          Cancelado
                        </div>
                      )}
                    </div>

                    {ag.status !== "cancelado" && (
                      <button
                        onClick={() => cancelarAgendamento(ag.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 bg-zinc-900 p-4 rounded-xl text-zinc-400">
                    Livre
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}