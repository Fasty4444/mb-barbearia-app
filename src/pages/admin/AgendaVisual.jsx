import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import DarBaixaModal from "../../components/admin/caixa/DarBaixaModal"
import { obterHorariosPorData } from "../../utils/horarios"

function formatarHojeLocal() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function criarDataLocal(dataString) {
  const [ano, mes, dia] = dataString.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function formatarDataISO(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const dia = String(date.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function formatarTituloDia(dataString) {
  const data = criarDataLocal(dataString)
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

function formatarDataBR(data) {
  if (!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

function horaParaMinutos(hora) {
  const [h, m] = String(hora).slice(0, 5).split(":").map(Number)
  return h * 60 + m
}

function minutosParaHora(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function getWeekStart(dateString) {
  const base = criarDataLocal(dateString)
  const day = base.getDay()
  base.setDate(base.getDate() - day)
  return base
}

function getWeekDays(dateString) {
  const start = getWeekStart(dateString)
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function intervaloConflita(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && fimA > inicioB
}

function getPushInfo(item) {
  if (item.push_status === "ignorado_whatsapp") {
    return {
      label: "Ignorado por WhatsApp",
      classe: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    }
  }

  if (item.push_status === "erro") {
    return {
      label: "Erro no push",
      classe: "bg-red-500/15 text-red-400 border-red-500/30",
    }
  }

  if (item.push_lembrete_enviado || item.push_status === "enviado") {
    return {
      label: "Push enviado",
      classe: "bg-green-500/15 text-green-400 border-green-500/30",
    }
  }

  return {
    label: "Push não enviado",
    classe: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  }
}

function corStatus(status) {
  if (status === "pendente") return "bg-yellow-500/85 border-yellow-400"
  if (status === "confirmado") return "bg-green-600/85 border-green-400"
  if (status === "concluido") return "bg-blue-600/85 border-blue-400"
  if (status === "faltou") return "bg-orange-500/85 border-orange-400"
  if (status === "cancelado") return "bg-red-600/85 border-red-400"
  return "bg-zinc-700 border-zinc-500"
}

export default function AgendaVisual() {
  const navigate = useNavigate()
  const hoje = formatarHojeLocal()

  const [dataSelecionada, setDataSelecionada] = useState(hoje)
  const [visao, setVisao] = useState("dia")
  const [agendamentos, setAgendamentos] = useState([])
  const [agendamentosSemana, setAgendamentosSemana] = useState([])
  const [configDia, setConfigDia] = useState(null)
  const [intervaloAgenda, setIntervaloAgenda] = useState(35)
  const [modalAgendamento, setModalAgendamento] = useState(null)

  const [servicos, setServicos] = useState([])
  const [agendamentoEditando, setAgendamentoEditando] = useState(null)
  const [servicoEditado, setServicoEditado] = useState("")
  const [novaData, setNovaData] = useState("")
  const [novoHorario, setNovoHorario] = useState("")
  const [horariosEdicao, setHorariosEdicao] = useState([])
  const [darBaixaAberto, setDarBaixaAberto] = useState(false)
  const [agendamentoBaixa, setAgendamentoBaixa] = useState(null)

  const [novoAgendamentoAberto, setNovoAgendamentoAberto] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState("")
  const [novoServicoId, setNovoServicoId] = useState("")
  const [novaDataAgendamento, setNovaDataAgendamento] = useState(hoje)
  const [novoHorarioAgendamento, setNovoHorarioAgendamento] = useState("")
  const [horariosNovoAgendamento, setHorariosNovoAgendamento] = useState([])
  const [salvandoNovoAgendamento, setSalvandoNovoAgendamento] = useState(false)

  async function carregarTudo() {
    const diaSemana = criarDataLocal(dataSelecionada).getDay()

    const { data: funcionamento } = await supabase
      .from("horarios_funcionamento")
      .select("*")
      .eq("dia_semana", diaSemana)
      .limit(1)
      .single()

    setConfigDia(funcionamento || null)
    setIntervaloAgenda(Number(funcionamento?.intervalo || 35))

    const { data, error } = await supabase
      .from("agendamentos")
      .select(`
        id,
        data,
        horario,
        status,
        lembrete_enviado,
        push_lembrete_enviado,
        push_lembrete_enviado_em,
        push_status,
        push_erro,
        cliente_id,
        servico_id,
        barbeiro_id,
        status_pagamento,
        valor_pago,
        forma_pagamento,
        caixa_id,
        pago_em,
        clientes(nome, telefone),
        servicos(nome, preco, duracao),
        barbeiros(nome)
      `)
      .eq("data", dataSelecionada)
      .order("horario", { ascending: true })

    if (error) {
      console.log("Erro ao carregar agenda visual:", error)
      setAgendamentos([])
      return
    }

    setAgendamentos(data || [])
  }

async function carregarSemana() {
  let inicio
  let fim

  if (visao === "mes") {
    const base = criarDataLocal(dataSelecionada)
    const ano = base.getFullYear()
    const mes = base.getMonth()

    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)

    inicio = formatarDataISO(primeiroDia)
    fim = formatarDataISO(ultimoDia)
  } else {
    const dias = getWeekDays(dataSelecionada)
    inicio = formatarDataISO(dias[0])
    fim = formatarDataISO(dias[6])
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      id,
      data,
      horario,
      status,
      lembrete_enviado,
      push_lembrete_enviado,
      push_lembrete_enviado_em,
      push_status,
      push_erro,
      cliente_id,
      servico_id,
      barbeiro_id,
      status_pagamento,
      valor_pago,
      forma_pagamento,
      caixa_id,
      pago_em,
      clientes(nome, telefone),
      servicos(nome, preco, duracao),
      barbeiros(nome)
    `)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: true })
    .order("horario", { ascending: true })

  if (error) {
    console.log("Erro ao carregar período:", error)
    setAgendamentosSemana([])
    return
  }

  setAgendamentosSemana(data || [])
}

  useEffect(() => {
    carregarTudo()
  }, [dataSelecionada])

useEffect(() => {
  if (visao === "semana" || visao === "mes") {
    carregarSemana()
  }
}, [visao, dataSelecionada])

  useEffect(() => {
    async function carregarHorariosEdicao() {
      if (!agendamentoEditando || !novaData) {
        setHorariosEdicao([])
        return
      }

      const lista = await obterHorariosPorData(novaData)
      setHorariosEdicao(Array.isArray(lista) ? lista : [])
    }

    carregarHorariosEdicao()
  }, [agendamentoEditando, novaData])

  useEffect(() => {
    async function carregarServicos() {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("preco")

      if (error) {
        console.log("Erro ao carregar serviços:", error)
        setServicos([])
        return
      }

      setServicos(data || [])
    }

    carregarServicos()
  }, [])

  useEffect(() => {
    if (!novoAgendamentoAberto) return
    carregarHorariosNovoAgendamento(novaDataAgendamento, novoServicoId)
  }, [novoAgendamentoAberto, novaDataAgendamento, novoServicoId])

  function mudarDia(direcao) {
    const base = criarDataLocal(dataSelecionada)

    if (visao === "semana") {
      base.setDate(base.getDate() + direcao * 7)
    } else if (visao === "mes") {
      base.setMonth(base.getMonth() + direcao)
    } else {
      base.setDate(base.getDate() + direcao)
    }

    setDataSelecionada(formatarDataISO(base))
  }

  function abrirEditarAgendamento(item) {
    setAgendamentoEditando(item)
    setServicoEditado(item.servico_id || "")
    setNovaData(item.data)
    setNovoHorario(item.horario)
  }

  function abrirDarBaixa(item) {
    setAgendamentoBaixa(item)
    setDarBaixaAberto(true)
  }

  function obterDuracaoServicoPorId(servicoId) {
    const servicoEncontrado = servicos.find((s) => s.id === servicoId)
    return Number(servicoEncontrado?.duracao || 0)
  }

  function obterLabelDuracao(minutos) {
    if (!minutos) return "-"

    if (minutos < 60) return `${minutos} min`

    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60

    if (mins === 0) return `${horas}h`

    return `${horas}h ${mins}min`
  }

  function abrirNovoAgendamento() {
    setNovoAgendamentoAberto(true)
    setNovoClienteNome("")
    setNovoServicoId("")
    setNovaDataAgendamento(dataSelecionada)
    setNovoHorarioAgendamento("")
    setHorariosNovoAgendamento([])
  }

  async function carregarHorariosNovoAgendamento(dataBase, servicoId) {
    const duracaoServico = obterDuracaoServicoPorId(servicoId)

    if (!dataBase || !servicoId || !duracaoServico) {
      setHorariosNovoAgendamento([])
      return
    }

    const diaSemana = criarDataLocal(dataBase).getDay()

    const { data: funcionamento, error: erroFuncionamento } = await supabase
      .from("horarios_funcionamento")
      .select("*")
      .eq("dia_semana", diaSemana)
      .limit(1)
      .single()

    if (erroFuncionamento || !funcionamento || !funcionamento.ativo) {
      setHorariosNovoAgendamento([])
      return
    }

    const { data: agendamentosDia, error: erroAgendamentos } = await supabase
      .from("agendamentos")
      .select(`
        horario,
        status,
        servicos(duracao)
      `)
      .eq("data", dataBase)
      .neq("status", "cancelado")

    if (erroAgendamentos) {
      console.log("Erro ao buscar agendamentos do novo agendamento:", erroAgendamentos)
      setHorariosNovoAgendamento([])
      return
    }

    const { data: bloqueiosHorarios } = await supabase
      .from("bloqueios_horarios")
      .select("horario")
      .eq("data", dataBase)

    const inicioExpediente = horaParaMinutos(funcionamento.hora_inicio)
    const fimExpediente = horaParaMinutos(funcionamento.hora_fim)

    const agendamentosConvertidos = (agendamentosDia || []).map((item) => {
      const inicio = horaParaMinutos(item.horario)
      const duracao = Number(item.servicos?.duracao || 0)

      return {
        inicio,
        fim: inicio + duracao
      }
    })

    const bloqueiosConvertidos = (bloqueiosHorarios || []).map((item) => {
      const inicio = horaParaMinutos(item.horario)
      return {
        inicio,
        fim: inicio + 1
      }
    })

    const indisponiveis = [...agendamentosConvertidos, ...bloqueiosConvertidos]

    let cursor = inicioExpediente
    const horarios = []

    while (cursor + duracaoServico <= fimExpediente) {
      const fimCandidato = cursor + duracaoServico

      const conflitos = indisponiveis.filter((item) =>
        intervaloConflita(cursor, fimCandidato, item.inicio, item.fim)
      )

      if (conflitos.length === 0) {
        horarios.push(minutosParaHora(cursor))
        cursor += duracaoServico
      } else {
        cursor = Math.max(...conflitos.map((item) => item.fim))
      }
    }

    setHorariosNovoAgendamento(horarios)
  }

  async function salvarNovoAgendamento() {
    if (!novoClienteNome || !novoServicoId || !novaDataAgendamento || !novoHorarioAgendamento) {
      alert("Preencha nome, serviço, data e horário.")
      return
    }

    try {
      setSalvandoNovoAgendamento(true)

      const { data: clienteNovo, error: erroCliente } = await supabase
        .from("clientes")
        .insert({
          nome: novoClienteNome
        })
        .select("id")
        .single()

      if (erroCliente) throw erroCliente

      const { error: erroAgendamento } = await supabase
        .from("agendamentos")
        .insert({
          cliente_id: clienteNovo.id,
          servico_id: novoServicoId,
          data: novaDataAgendamento,
          horario: novoHorarioAgendamento,
          status: "confirmado",
          lembrete_enviado: false
        })

      if (erroAgendamento) throw erroAgendamento

      setNovoAgendamentoAberto(false)
      await carregarTudo()

      if (visao === "semana") {
        await carregarSemana()
      }
    } catch (error) {
      console.log("Erro ao criar novo agendamento:", error)
      alert(error.message || "Erro ao criar agendamento.")
    } finally {
      setSalvandoNovoAgendamento(false)
    }
  }

  async function salvarEdicaoAgendamento() {
    if (!agendamentoEditando) return

    const { error } = await supabase
      .from("agendamentos")
      .update({
        servico_id: servicoEditado,
        data: novaData,
        horario: novoHorario
      })
      .eq("id", agendamentoEditando.id)

    if (error) {
      console.log("Erro ao salvar edição:", error)
      alert("Erro ao salvar edição.")
      return
    }

    setAgendamentoEditando(null)
    setModalAgendamento(null)
    await carregarTudo()

    if (visao === "semana") {
      await carregarSemana()
    }
  }

  async function handleStatusChange(item, novoStatus) {
    await supabase
      .from("agendamentos")
      .update({ status: novoStatus })
      .eq("id", item.id)

    await carregarTudo()

    if (visao === "semana") {
      await carregarSemana()
    }

    setModalAgendamento((atual) =>
      atual ? { ...atual, status: novoStatus } : atual
    )
  }

  async function abrirWhatsApp(item) {
    const numero = item.clientes?.telefone?.replace(/\D/g, "")
    if (!numero) return

    if (!item.lembrete_enviado) {
      const baseUrl = window.location.origin
      const linkConfirmar = `${baseUrl}/confirmar?id=${item.id}`
      const linkCancelar = `${baseUrl}/cancelar?id=${item.id}`

      const mensagem = `Olá ${item.clientes?.nome}!

Você tem um horário na MB Barbearia 💈

📅 ${formatarDataBR(item.data)}
⏰ ${item.horario}
✂️ ${item.servicos?.nome}
👤 ${item.barbeiros?.nome}

⚠️ Chegue 5 minutos antes.

✅ Confirmar:
${linkConfirmar}

❌ Cancelar:
${linkCancelar}`

      const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`
      window.location.href = url

      await supabase
        .from("agendamentos")
        .update({ lembrete_enviado: true })
        .eq("id", item.id)
    } else {
      window.location.href = `https://wa.me/55${numero}`
    }

    await carregarTudo()

    if (visao === "semana") {
      await carregarSemana()
    }
  }

  const slots = useMemo(() => {
    if (!configDia?.ativo) return []

    const inicio = horaParaMinutos(configDia.hora_inicio)
    const fim = horaParaMinutos(configDia.hora_fim)
    const lista = []

    for (let t = inicio; t <= fim; t += intervaloAgenda) {
      lista.push({
        label: minutosParaHora(t),
        minutos: t
      })
    }

    return lista
  }, [configDia, intervaloAgenda])

  const inicioAgenda = slots.length ? slots[0].minutos : 0
  const alturaLinha = 56
  const pixelsPorMinuto = alturaLinha / intervaloAgenda

const itensRenderizados = agendamentos
  .filter((item) => item.status !== "cancelado")
  .map((item) => {
    const inicio = horaParaMinutos(item.horario)
    const duracao = Number(item.servicos?.duracao || intervaloAgenda)
    const fim = inicio + duracao

    const top = (inicio - inicioAgenda) * pixelsPorMinuto
    const height = Math.max(duracao * pixelsPorMinuto, 30)

    return {
      ...item,
      fimLabel: minutosParaHora(fim),
      top,
      height
    }
  })

  const diasSemana = useMemo(() => getWeekDays(dataSelecionada), [dataSelecionada])

  const itensSemanaRenderizados = useMemo(() => {
    return diasSemana.map((dia) => {
      const iso = formatarDataISO(dia)
const itensDoDia = agendamentosSemana
  .filter((item) => item.data === iso && item.status !== "cancelado")
  .map((item) => {
    const inicio = horaParaMinutos(item.horario)
    const duracao = Number(item.servicos?.duracao || intervaloAgenda)
    const fim = inicio + duracao

    const top = (inicio - inicioAgenda) * pixelsPorMinuto
    const height = Math.max(duracao * pixelsPorMinuto, 30)

    return {
      ...item,
      fimLabel: minutosParaHora(fim),
      top,
      height
    }
  })

      return {
        data: iso,
        dataObj: dia,
        itens: itensDoDia
      }
    })
  }, [diasSemana, agendamentosSemana, inicioAgenda, intervaloAgenda, pixelsPorMinuto])

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
<button
  onClick={() => navigate("/admin?agenda=escolha")}
  className="text-zinc-400 hover:text-white mb-4"
>
  ← Voltar para escolha
</button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Agenda visual</h1>
            <p className="text-zinc-400 mt-1">
              Visualização em grade com blocos de duração real
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => mudarDia(-1)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500"
            >
              ←
            </button>

            <button
              onClick={() => setDataSelecionada(hoje)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500"
            >
              Hoje
            </button>

            <button
              onClick={() => mudarDia(1)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500"
            >
              →
            </button>

            <button
              onClick={abrirNovoAgendamento}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-xl hover:brightness-110"
            >
              + Novo agendamento
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setVisao("mes")}
            className={`px-4 py-2 rounded-xl border ${
              visao === "mes"
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
            }`}
          >
            Mês
          </button>

          <button
            onClick={() => setVisao("semana")}
            className={`px-4 py-2 rounded-xl border ${
              visao === "semana"
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
            }`}
          >
            Semana
          </button>

          <button
            onClick={() => setVisao("dia")}
            className={`px-4 py-2 rounded-xl border ${
              visao === "dia"
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
            }`}
          >
            Dia
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 capitalize">
            {visao === "dia"
              ? formatarTituloDia(dataSelecionada)
              : visao === "semana"
              ? `Semana de ${formatarDataBR(formatarDataISO(diasSemana[0]))} até ${formatarDataBR(formatarDataISO(diasSemana[6]))}`
              : formatarTituloDia(dataSelecionada)}
          </h2>

{visao === "mes" && (() => {
  const base = criarDataLocal(dataSelecionada)
  const ano = base.getFullYear()
  const mes = base.getMonth()

  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)

  const inicioGrade = new Date(primeiroDia)
  inicioGrade.setDate(primeiroDia.getDate() - primeiroDia.getDay())

  const fimGrade = new Date(ultimoDia)
  fimGrade.setDate(ultimoDia.getDate() + (6 - ultimoDia.getDay()))

  const diasCalendario = []
  const cursor = new Date(inicioGrade)

  while (cursor <= fimGrade) {
    diasCalendario.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const mapaMes = {}
  diasCalendario.forEach((dia) => {
    mapaMes[formatarDataISO(dia)] = []
  })

  agendamentosSemana.forEach((item) => {
    if (!mapaMes[item.data]) mapaMes[item.data] = []
    mapaMes[item.data].push(item)
  })

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-zinc-950 border-b border-zinc-800">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div
            key={dia}
            className="p-3 text-center text-sm font-semibold text-zinc-400 border-r last:border-r-0 border-zinc-800"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {diasCalendario.map((dia) => {
          const iso = formatarDataISO(dia)
          const itensDia = (mapaMes[iso] || []).filter(
            (item) => item.status !== "cancelado"
          )

          const ehMesAtual = dia.getMonth() === mes
          const ehHoje = iso === hoje
          const ehSelecionado = iso === dataSelecionada

          return (
            <button
              key={iso}
              onClick={() => {
                setDataSelecionada(iso)
                setVisao("dia")
              }}
              className={`min-h-[120px] md:min-h-[140px] p-2 border-r border-b last:border-r-0 border-zinc-800 text-left align-top transition ${
                ehMesAtual ? "bg-black" : "bg-zinc-950/60"
              } ${ehSelecionado ? "ring-1 ring-yellow-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-bold ${
                    ehMesAtual ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {dia.getDate()}
                </span>

                {ehHoje && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500 text-black font-semibold">
                    Hoje
                  </span>
                )}
              </div>

              {ehMesAtual && (
                <div className="mt-3">
                  {itensDia.length === 0 ? (
                    <div className="text-[11px] text-zinc-600">
                      Sem horários
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-yellow-400" />
                      <span className="text-yellow-400 text-xs md:text-sm font-semibold">
                        {itensDia.length} horário{itensDia.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})()}
          {visao === "dia" && (
            <div className="relative border border-zinc-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[90px_1fr] bg-zinc-950 border-b border-zinc-800">
                <div className="p-3 border-r border-zinc-800 text-zinc-500 font-semibold">
                  Horário
                </div>
                <div className="p-3 font-semibold text-center">
                  {agendamentos[0]?.barbeiros?.nome || "Agenda do dia"}
                </div>
              </div>

              <div className="grid grid-cols-[90px_1fr]">
                <div className="border-r border-zinc-800 bg-zinc-950">
                  {slots.map((slot) => (
                    <div
                      key={slot.label}
                      className="h-14 px-2 md:px-3 border-b border-zinc-800/80 text-xs md:text-sm text-zinc-400 flex items-start pt-2"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                <div className="relative bg-black">
                  {slots.map((slot) => (
                    <div
                      key={slot.label}
                      className="h-14 border-b border-zinc-800/80"
                    />
                  ))}

                  {itensRenderizados.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setModalAgendamento(item)}
                      className={`absolute left-1 md:left-2 right-1 md:right-2 rounded-xl border px-2 md:px-3 py-1.5 text-left shadow-lg overflow-hidden ${corStatus(item.status)}`}
                      style={{
                        top: `${item.top + 1}px`,
                        height: `${item.height - 2}px`
                      }}
                    >
                      <div className="text-[10px] md:text-xs opacity-90 mb-1 leading-tight">
                        {item.horario} - {item.fimLabel}
                      </div>

                      <div className="font-bold text-sm md:text-base leading-tight break-words">
                        {item.clientes?.nome || "Cliente"}
                      </div>

                      <div className="text-xs md:text-sm opacity-90 truncate">
                        {item.servicos?.nome || "Serviço"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {visao === "semana" && (
            <div className="border border-zinc-800 rounded-xl overflow-x-auto">
              <div
                className="grid min-w-[980px]"
                style={{ gridTemplateColumns: "80px repeat(7, minmax(140px, 1fr))" }}
              >
                <div className="bg-zinc-950 border-b border-r border-zinc-800 p-3 text-zinc-500 font-semibold">
                  Horário
                </div>

                {itensSemanaRenderizados.map((dia) => (
                  <button
                    key={dia.data}
                    onClick={() => {
                      setDataSelecionada(dia.data)
                      setVisao("dia")
                    }}
                    className={`bg-zinc-950 border-b border-r last:border-r-0 border-zinc-800 p-3 text-center ${
                      dia.data === dataSelecionada ? "text-yellow-500" : "text-white"
                    }`}
                  >
                    <div className="text-xs md:text-sm text-zinc-500">
                      {dia.dataObj.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                    </div>
                    <div className="font-bold">
                      {String(dia.dataObj.getDate()).padStart(2, "0")}/{String(dia.dataObj.getMonth() + 1).padStart(2, "0")}
                    </div>
                  </button>
                ))}

                <div className="border-r border-zinc-800 bg-zinc-950">
                  {slots.map((slot) => (
                    <div
                      key={slot.label}
                      className="h-14 px-2 border-b border-zinc-800/80 text-xs md:text-sm text-zinc-400 flex items-start pt-2"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                {itensSemanaRenderizados.map((dia) => (
                  <div
                    key={dia.data}
                    className="relative bg-black border-r last:border-r-0 border-zinc-800"
                  >
                    {slots.map((slot) => (
                      <div
                        key={slot.label}
                        className="h-14 border-b border-zinc-800/80"
                      />
                    ))}

                    {dia.itens.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setModalAgendamento(item)}
                        className={`absolute left-1 right-1 rounded-xl border px-2 py-1.5 text-left shadow-lg overflow-hidden ${corStatus(item.status)}`}
                        style={{
                          top: `${item.top + 1}px`,
                          height: `${item.height - 2}px`
                        }}
                      >
                        <div className="text-[10px] opacity-90 mb-1 leading-tight">
                          {item.horario} - {item.fimLabel}
                        </div>

                        <div className="font-bold text-xs md:text-sm leading-tight break-words">
                          {item.clientes?.nome || "Cliente"}
                        </div>

                        <div className="text-[10px] md:text-xs opacity-90 truncate">
                          {item.servicos?.nome || "Serviço"}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalAgendamento && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl w-full max-w-lg border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-bold">
                  {modalAgendamento.clientes?.nome || "Cliente"}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {modalAgendamento.servicos?.nome} • {modalAgendamento.horario}
                </p>
              </div>

              <button
                onClick={() => setModalAgendamento(null)}
                className="bg-red-500 px-3 py-1 rounded-lg"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-3 mb-5">
              <div className="bg-zinc-950 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Telefone</p>
                <p className="font-bold">
                  {modalAgendamento.clientes?.telefone || "Sem telefone"}
                </p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Status do agendamento</p>
                <p className="font-bold capitalize">{modalAgendamento.status}</p>
              </div>

              <div className={`rounded-xl p-4 border ${getPushInfo(modalAgendamento).classe}`}>
                <p className="text-sm font-semibold">
                  {getPushInfo(modalAgendamento).label}
                </p>

                {modalAgendamento.push_erro && (
                  <p className="text-xs mt-2 break-words">
                    {modalAgendamento.push_erro}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
              <button
                onClick={() => handleStatusChange(modalAgendamento, "pendente")}
                className="bg-zinc-700 px-3 py-2 rounded-lg"
              >
                Pendente
              </button>

              <button
                onClick={() => handleStatusChange(modalAgendamento, "confirmado")}
                className="bg-green-500 text-black px-3 py-2 rounded-lg font-semibold"
              >
                Confirmado
              </button>

              <button
                onClick={() => handleStatusChange(modalAgendamento, "concluido")}
                className="bg-blue-500 text-black px-3 py-2 rounded-lg font-semibold"
              >
                Concluído
              </button>

              <button
                onClick={() => handleStatusChange(modalAgendamento, "faltou")}
                className="bg-orange-500 text-black px-3 py-2 rounded-lg font-semibold"
              >
                Faltou
              </button>

              <button
                onClick={() => handleStatusChange(modalAgendamento, "cancelado")}
                className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold"
              >
                Cancelado
              </button>

              <button
                onClick={() => abrirWhatsApp(modalAgendamento)}
                className="bg-emerald-500 text-black px-3 py-2 rounded-lg font-semibold"
              >
                WhatsApp
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => abrirEditarAgendamento(modalAgendamento)}
                className="bg-yellow-500 text-black px-3 py-2 rounded-lg font-semibold"
              >
                Editar agendamento
              </button>

              {modalAgendamento.status_pagamento === "pago" ? (
                <button
                  disabled
                  className="bg-emerald-700 text-white px-3 py-2 rounded-lg font-semibold opacity-80"
                >
                  Pago
                </button>
              ) : (
                <button
                  onClick={() => abrirDarBaixa(modalAgendamento)}
                  className="bg-green-500 text-black px-3 py-2 rounded-lg font-semibold"
                >
                  Dar baixa
                </button>
              )}
            </div>

            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl"
            >
              Ir para agenda principal
            </button>
          </div>
        </div>
      )}

      {agendamentoEditando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md border border-zinc-800">
            <h2 className="text-xl mb-4">Editar agendamento</h2>

            <select
              value={servicoEditado}
              onChange={(e) => setServicoEditado(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 rounded"
            >
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — R$ {s.preco}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 rounded"
            />

            <select
              value={novoHorario}
              onChange={(e) => setNovoHorario(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 rounded"
            >
              {horariosEdicao.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={salvarEdicaoAgendamento}
                className="bg-green-500 text-black px-4 py-2 rounded"
              >
                Salvar
              </button>

              <button
                onClick={() => setAgendamentoEditando(null)}
                className="bg-zinc-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {novoAgendamentoAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl w-full max-w-md border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-bold">Novo agendamento</h3>
                <p className="text-zinc-400 text-sm">
                  Crie um agendamento manualmente pela agenda visual
                </p>
              </div>

              <button
                onClick={() => setNovoAgendamentoAberto(false)}
                className="bg-red-500 px-3 py-1 rounded-lg"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Nome do cliente</label>
                <input
                  type="text"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700"
                  placeholder="Digite o nome"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Serviço</label>
                <select
                  value={novoServicoId}
                  onChange={(e) => {
                    setNovoServicoId(e.target.value)
                    setNovoHorarioAgendamento("")
                  }}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700"
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} — R$ {s.preco}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Duração</label>
                <div className="w-full p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-white">
                  {obterLabelDuracao(obterDuracaoServicoPorId(novoServicoId))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Data</label>
                <input
                  type="date"
                  value={novaDataAgendamento}
                  onChange={(e) => {
                    setNovaDataAgendamento(e.target.value)
                    setNovoHorarioAgendamento("")
                  }}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Horário</label>
                <select
                  value={novoHorarioAgendamento}
                  onChange={(e) => setNovoHorarioAgendamento(e.target.value)}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700"
                  size={1}
                >
                  <option value="">Selecione um horário</option>
                  {horariosNovoAgendamento.map((hora) => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>

                {novoServicoId && horariosNovoAgendamento.length === 0 && (
                  <p className="text-sm text-red-400 mt-2">
                    Nenhum horário disponível para esse serviço nessa data.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={salvarNovoAgendamento}
                  disabled={salvandoNovoAgendamento}
                  className="flex-1 bg-green-500 text-black font-semibold py-3 rounded-xl"
                >
                  {salvandoNovoAgendamento ? "Salvando..." : "Salvar agendamento"}
                </button>

                <button
                  onClick={() => setNovoAgendamentoAberto(false)}
                  className="flex-1 bg-zinc-700 text-white py-3 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DarBaixaModal
        aberto={darBaixaAberto}
        agendamento={agendamentoBaixa}
        onClose={() => {
          setDarBaixaAberto(false)
          setAgendamentoBaixa(null)
        }}
        onSuccess={() => {
          carregarTudo()
          setModalAgendamento(null)
          if (visao === "semana") carregarSemana()
        }}
      />
    </div>
  )
}