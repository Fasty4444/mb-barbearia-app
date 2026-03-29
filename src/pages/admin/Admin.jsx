import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import { obterHorariosPorData } from "../../utils/horarios"
import { useNavigate } from "react-router-dom"
import DarBaixaModal from "../../components/admin/caixa/DarBaixaModal"
import NovaMovimentacaoModal from "../../components/admin/caixa/NovaMovimentacaoModal"
import { motion } from "framer-motion"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

function formatarHojeLocal() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function formatarDataISO(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const dia = String(date.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function criarDataLocal(dataString) {
  const [ano, mes, dia] = dataString.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function formatarDataBR(data) {
  if (!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

function nomesMeses() {
  return [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ]
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(date) {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getMonthGrid(date) {
  const ano = date.getFullYear()
  const mes = date.getMonth()
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)

  const primeiroDiaSemana = primeiroDia.getDay()
  const totalDias = ultimoDia.getDate()

  const dias = []

  for (let i = 0; i < primeiroDiaSemana; i++) dias.push(null)
  for (let dia = 1; dia <= totalDias; dia++) dias.push(new Date(ano, mes, dia))
  while (dias.length % 7 !== 0) dias.push(null)

  return dias
}

function getRangePorVisao(visao, dataBase) {
  const base = new Date(dataBase)
  base.setHours(0, 0, 0, 0)

  if (visao === "mensal") {
    const inicio = new Date(base.getFullYear(), base.getMonth(), 1)
    const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return { inicio, fim }
  }

  if (visao === "semanal") {
    const inicio = getWeekStart(base)
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    return { inicio, fim }
  }

  return { inicio: base, fim: base }
}

function tituloPeriodoCalendario(visao, dataBase) {
  const meses = nomesMeses()
  const base = new Date(dataBase)

  if (visao === "mensal") {
    return `${meses[base.getMonth()]} ${base.getFullYear()}`
  }

  if (visao === "semanal") {
    const dias = getWeekDays(base)
    const inicio = dias[0]
    const fim = dias[6]
    return `${formatarDataBR(formatarDataISO(inicio))} até ${formatarDataBR(formatarDataISO(fim))}`
  }

  return formatarDataBR(formatarDataISO(base))
}

function StatusDots({ resumo }) {
  const itens = [
    { key: "pendente", cor: "bg-yellow-400" },
    { key: "confirmado", cor: "bg-green-400" },
    { key: "concluido", cor: "bg-blue-400" },
    { key: "faltou", cor: "bg-orange-400" },
    { key: "cancelado", cor: "bg-red-400" }
  ].filter(item => (resumo?.[item.key] || 0) > 0)

  if (itens.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {itens.map(item => (
        <span
          key={item.key}
          className={`w-2.5 h-2.5 rounded-full ${item.cor}`}
          title={`${item.key}: ${resumo[item.key]}`}
        />
      ))}
    </div>
  )
}

function DiaCardCalendario({
  data,
  selecionado,
  hoje,
  quantidade,
  resumo,
  onClick,
  compacto = false
}) {
  if (!data) {
    return (
      <div className={`rounded-xl ${compacto ? "min-h-[88px]" : "min-h-[74px] md:min-h-[96px]"}`} />
    )
  }

  const iso = formatarDataISO(data)
  const isHoje = iso === hoje
  const temAgendamento = quantidade > 0

  return (
    <button
      onClick={() => onClick(iso)}
      className={`rounded-xl border p-2 text-left transition ${
        selecionado
          ? "border-yellow-500 bg-yellow-500/10"
          : temAgendamento
          ? "border-green-500/40 bg-zinc-950 hover:border-yellow-500"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
      } ${compacto ? "min-h-[88px]" : "min-h-[74px] md:min-h-[96px]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-sm md:text-base font-semibold ${isHoje ? "text-yellow-500" : "text-white"}`}>
          {data.getDate()}
        </span>

        {temAgendamento && (
          <span className="text-[10px] md:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            {quantidade}
          </span>
        )}
      </div>

      {temAgendamento && (
        <div className="mt-2 text-[10px] md:text-xs text-zinc-400">
          {quantidade} agendamento{quantidade > 1 ? "s" : ""}
        </div>
      )}

      <StatusDots resumo={resumo} />
    </button>
  )
}

function StatusMenu({
  item,
  statusMenuId,
  setStatusMenuId,
  onChange
}) {
  const aberto = statusMenuId === item.id

  const label =
    item.status === "concluido" ? "Concluído" :
    item.status === "confirmado" ? "Confirmado" :
    item.status === "cancelado" ? "Cancelado" :
    item.status === "faltou" ? "Faltou" :
    "Pendente"

  const cor =
    item.status === "concluido" ? "bg-blue-500" :
    item.status === "confirmado" ? "bg-green-500" :
    item.status === "cancelado" ? "bg-red-500" :
    item.status === "faltou" ? "bg-orange-500" :
    "bg-zinc-800"

  const opcoes = [
    { value: "pendente", label: "Pendente", bg: "bg-zinc-800" },
    { value: "confirmado", label: "Confirmado", bg: "bg-green-500" },
    { value: "concluido", label: "Concluído", bg: "bg-blue-500" },
    { value: "cancelado", label: "Cancelado", bg: "bg-red-500" },
    { value: "faltou", label: "Faltou", bg: "bg-orange-500" }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setStatusMenuId(aberto ? null : item.id)}
        className={`px-3 py-2 rounded text-white font-semibold min-w-[120px] text-left ${cor}`}
      >
        {label}
      </button>

{aberto && (
  <div className="absolute left-0 bottom-full mb-2 z-[999] w-44 max-h-60 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
          {opcoes.map(opcao => (
            <button
              key={opcao.value}
              onClick={() => {
                setStatusMenuId(null)
                onChange(item, opcao.value)
              }}
              className={`w-full text-left px-3 py-3 text-white hover:brightness-110 ${opcao.bg}`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [aba, setAba] = useState("dashboard")
  const [agendaModo, setAgendaModo] = useState("")
  const [visaoCalendario, setVisaoCalendario] = useState("mensal")
  const [statusMenuId, setStatusMenuId] = useState(null)

  const [agendamentos, setAgendamentos] = useState([])
  const hoje = formatarHojeLocal()
  const [dataSelecionada, setDataSelecionada] = useState(hoje)

  const [clientes, setClientes] = useState([])
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("")
  const [filtroLembrete, setFiltroLembrete] = useState("")

  const [modalCliente, setModalCliente] = useState(null)
  const [editando, setEditando] = useState(false)
  const [nomeEditado, setNomeEditado] = useState("")
  const [telefoneEditado, setTelefoneEditado] = useState("")
  const [nascimentoEditado, setNascimentoEditado] = useState("")

  const [agendamentoEditando, setAgendamentoEditando] = useState(null)
  const [novaData, setNovaData] = useState("")
  const [novoHorario, setNovoHorario] = useState("")
  const [horariosEdicao, setHorariosEdicao] = useState([])
  const [servicos, setServicos] = useState([])
  const [servicoEditado, setServicoEditado] = useState("")

  const [aniversariantesHoje, setAniversariantesHoje] = useState([])
  const [todosHorarios, setTodosHorarios] = useState([])

  const [dataCalendarioBase, setDataCalendarioBase] = useState(hoje)
  const [diaCalendarioSelecionado, setDiaCalendarioSelecionado] = useState(hoje)
  const [agendamentosCalendario, setAgendamentosCalendario] = useState([])
  const [filtroCalendarioStatus, setFiltroCalendarioStatus] = useState("")
  const [filtroCalendarioBarbeiro, setFiltroCalendarioBarbeiro] = useState("")

  const [darBaixaAberto, setDarBaixaAberto] = useState(false)
  const [agendamentoBaixa, setAgendamentoBaixa] = useState(null)
  

  const navigate = useNavigate()

  function calcularIdade(data) {
    if (!data) return ""

    const [ano, mes, dia] = data.split("-")
    const hojeAtual = new Date()

    let idade = hojeAtual.getFullYear() - Number(ano)

    if (
      hojeAtual.getMonth() + 1 < Number(mes) ||
      (hojeAtual.getMonth() + 1 === Number(mes) && hojeAtual.getDate() < Number(dia))
    ) {
      idade--
    }

    return idade
  }

  function formatarDataComIdade(data) {
    if (!data) return "Não informado"

    const [ano, mes, dia] = data.split("-")
    const hojeAtual = new Date()
    const nascimento = new Date(`${ano}-${mes}-${dia}`)

    let idade = hojeAtual.getFullYear() - nascimento.getFullYear()

    const mesAtual = hojeAtual.getMonth() + 1
    const diaAtual = hojeAtual.getDate()

    if (
      mesAtual < Number(mes) ||
      (mesAtual === Number(mes) && diaAtual < Number(dia))
    ) {
      idade--
    }

    return `${dia}/${mes}/${ano} (${idade} anos)`
  }

  function abrirEditarAgendamento(item) {
    setAgendamentoEditando(item)
    setNovaData(item.data)
    setNovoHorario(item.horario)
    setServicoEditado(item.servico_id)
  }

  function abrirDarBaixa(item) {
  setAgendamentoBaixa(item)
  setDarBaixaAberto(true)
}

  async function abrirCliente(cliente) {
    setModalCliente({
      id: String(cliente.id),
      nome: cliente.nome,
      telefone: cliente.telefone,
      nascimento: cliente.nascimento || ""
    })

    setNomeEditado(cliente.nome || "")
    setTelefoneEditado(cliente.telefone || "")
    setNascimentoEditado(cliente.nascimento || "")

    const { data } = await supabase
      .from("agendamentos")
      .select(`
        id,
        data,
        horario,
        status,
        servicos(nome, preco),
        barbeiros(nome)
      `)
      .eq("cliente_id", cliente.id)

    setHistorico(data || [])
  }

  async function salvarCliente() {
    const id = String(modalCliente.id).trim()

    const { data } = await supabase
      .from("clientes")
      .update({
        nome: nomeEditado,
        telefone: telefoneEditado,
        nascimento: nascimentoEditado || null
      })
      .eq("id", id)
      .select()

    if (data && data.length > 0) {
      setModalCliente({
        ...modalCliente,
        nome: nomeEditado,
        telefone: telefoneEditado,
        nascimento: nascimentoEditado
      })
    }

    setEditando(false)
    buscarClientes()
  }

  async function salvarEdicaoAgendamento() {
    await supabase
      .from("agendamentos")
      .update({
        data: novaData,
        horario: novoHorario,
        servico_id: servicoEditado
      })
      .eq("id", agendamentoEditando.id)

    setAgendamentoEditando(null)
    buscar()
    carregarAgendamentosCalendario()
  }

  async function buscar() {
    let query = supabase
      .from("agendamentos")
      .select(`
        id,
        data,
        horario,
        status,
        lembrete_enviado,
        cliente_id,
        servico_id,
        barbeiro_id,
        status_pagamento,
        valor_pago,
        forma_pagamento,
        caixa_id,
        pago_em,
        clientes(nome, telefone),
        servicos(nome, preco),
        barbeiros(nome)
      `)
      .order("data", { ascending: true })
      .order("horario", { ascending: true })

    if (dataSelecionada) {
      query = query.eq("data", dataSelecionada)
    }

    const { data } = await query
    setAgendamentos(data || [])
  }

  async function carregarAgendamentosCalendario() {
    const { inicio, fim } = getRangePorVisao(
      visaoCalendario,
      criarDataLocal(dataCalendarioBase)
    )

    const { data, error } = await supabase
      .from("agendamentos")
        .select(`
          id,
          data,
          horario,
          status,
          lembrete_enviado,
          cliente_id,
          servico_id,
          barbeiro_id,
          status_pagamento,
          valor_pago,
          forma_pagamento,
          caixa_id,
          pago_em,
          clientes(nome, telefone),
          servicos(nome, preco),
          barbeiros(nome)
        `)
      .gte("data", formatarDataISO(inicio))
      .lte("data", formatarDataISO(fim))
      .order("data", { ascending: true })
      .order("horario", { ascending: true })

    if (error) {
      console.log(error)
      setAgendamentosCalendario([])
      return
    }

    setAgendamentosCalendario(data || [])
  }

  useEffect(() => {
    async function carregarHorarios() {
      const lista = await obterHorariosPorData(dataSelecionada)
      setTodosHorarios(Array.isArray(lista) ? lista : [])
    }

    carregarHorarios()
  }, [dataSelecionada])

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
    async function buscarAniversariantes() {
      const hojeAtual = new Date()
      const mes = String(hojeAtual.getMonth() + 1).padStart(2, "0")
      const dia = String(hojeAtual.getDate()).padStart(2, "0")

      const { data } = await supabase
        .from("clientes")
        .select("*")

      const filtrados = (data || []).filter(c => {
        if (!c.nascimento) return false
        const [, mesNasc, diaNasc] = c.nascimento.split("-")
        return mesNasc === mes && diaNasc === dia
      })

      setAniversariantesHoje(filtrados)
    }

    buscarAniversariantes()
  }, [])

  useEffect(() => {
    buscar()
  }, [dataSelecionada])

  useEffect(() => {
    if (aba === "agenda" && agendaModo === "calendario") {
      carregarAgendamentosCalendario()
    }
  }, [aba, agendaModo, visaoCalendario, dataCalendarioBase])

  useEffect(() => {
    if (statusMenuId) {
      const fechar = () => setStatusMenuId(null)
      window.addEventListener("scroll", fechar, true)
      return () => window.removeEventListener("scroll", fechar, true)
    }
  }, [statusMenuId])

  async function handleStatusChange(item, novoStatus) {
    await supabase
      .from("agendamentos")
      .update({ status: novoStatus })
      .eq("id", item.id)

    const numero = item.clientes?.telefone?.replace(/\D/g, "")
    if (!numero) {
      buscar()
      carregarAgendamentosCalendario()
      return
    }

    const baseUrl = window.location.origin
    const linkRemarcar = `${baseUrl}/agendamento`

    let mensagem = ""

    if (novoStatus === "concluido") {
      mensagem = `Olá ${item.clientes?.nome}! 💈

Seu atendimento foi finalizado 🙌

Como foi sua experiência?
Deixe seu feedback ⭐`
    }

    if (novoStatus === "faltou") {
      mensagem = `Olá ${item.clientes?.nome}!

Você não compareceu ao seu horário 😕
Que tal reagendar?

👉 ${linkRemarcar}`
    }

    if (mensagem) {
      window.open(
        `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
        "_blank"
      )
    }

    buscar()
    carregarAgendamentosCalendario()
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

      window.open(
        `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
        "_blank"
      )

      await supabase
        .from("agendamentos")
        .update({ lembrete_enviado: true })
        .eq("id", item.id)
    } else {
      window.open(`https://wa.me/55${numero}`, "_blank")
    }

    buscar()
    carregarAgendamentosCalendario()
  }

  async function buscarClientes() {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("nome")

    setClientes(data || [])
  }

  useEffect(() => {
    if (aba === "clientes") {
      buscarClientes()
    }
  }, [aba])

  useEffect(() => {
    async function carregarServicos() {
      const { data } = await supabase
        .from("servicos")
        .select("*")
        .order("preco")

      setServicos(data || [])
    }

    carregarServicos()
  }, [])

  const filtro = dataSelecionada || hoje

  const agendamentosFiltrados = agendamentos
    .filter(a => a.data === filtro)
    .filter(a => !filtroStatus || a.status === filtroStatus)
    .filter(a => !filtroBarbeiro || a.barbeiros?.nome === filtroBarbeiro)
    .filter(a => {
      if (filtroLembrete === "pendente") return !a.lembrete_enviado
      if (filtroLembrete === "enviado") return a.lembrete_enviado
      return true
    })

  const horariosOcupados = agendamentosFiltrados.map(a => a.horario)
  const horariosDisponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h))

  const faturamentoPrevisto = agendamentosFiltrados.reduce((acc, item) => {
    return acc + (item.servicos?.preco || 0)
  }, 0)

  const faturamentoRealizado = agendamentosFiltrados
    .filter(a => a.status === "concluido")
    .reduce((acc, item) => {
      return acc + (item.servicos?.preco || 0)
    }, 0)

  const barbeirosUnicos = [
    ...new Set(agendamentos.map(a => a.barbeiros?.nome).filter(Boolean))
  ]

  function isProximoHorario(item) {
    const agora = new Date()
    const dataHora = new Date(`${item.data}T${item.horario}`)
    return dataHora > agora && item.status !== "cancelado"
  }

  const proximo = agendamentosFiltrados
    .filter(item => item.status !== "cancelado")
    .find(isProximoHorario)

  const clientesFiltrados = clientes.filter(cliente => {
    const termo = busca.toLowerCase()
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      String(cliente.telefone || "").toLowerCase().includes(termo)
    )
  })

  const totalGastoCliente = historico
    .filter(item => item.status === "concluido")
    .reduce((acc, item) => acc + (item.servicos?.preco || 0), 0)

  const totalAgendamentosCliente = historico.length
  const totalConcluidosCliente = historico.filter(item => item.status === "concluido").length
  const totalCanceladosCliente = historico.filter(item => item.status === "cancelado").length

  const contadorServicosCliente = {}
  historico.forEach(item => {
    const nome = item.servicos?.nome
    if (!nome) return
    if (!contadorServicosCliente[nome]) contadorServicosCliente[nome] = 0
    contadorServicosCliente[nome]++
  })

  const corteMaisFeitoCliente =
    Object.keys(contadorServicosCliente).length > 0
      ? Object.keys(contadorServicosCliente).reduce((a, b) =>
          contadorServicosCliente[a] > contadorServicosCliente[b] ? a : b
        )
      : "-"

  const contadorBarbeirosCliente = {}
  historico.forEach(item => {
    const nome = item.barbeiros?.nome
    if (!nome) return
    if (!contadorBarbeirosCliente[nome]) contadorBarbeirosCliente[nome] = 0
    contadorBarbeirosCliente[nome]++
  })

  const barbeiroMaisFrequente =
    Object.keys(contadorBarbeirosCliente).length > 0
      ? Object.keys(contadorBarbeirosCliente).reduce((a, b) =>
          contadorBarbeirosCliente[a] > contadorBarbeirosCliente[b] ? a : b
        )
      : "-"

  const barbeirosCalendarioUnicos = [
    ...new Set(agendamentosCalendario.map(a => a.barbeiros?.nome).filter(Boolean))
  ]

  const agendamentosCalendarioFiltrados = agendamentosCalendario
    .filter(item => !filtroCalendarioStatus || item.status === filtroCalendarioStatus)
    .filter(item => !filtroCalendarioBarbeiro || item.barbeiros?.nome === filtroCalendarioBarbeiro)

  const mapaAgendamentosPorDia = useMemo(() => {
    const mapa = {}

    agendamentosCalendarioFiltrados.forEach(item => {
      if (!mapa[item.data]) {
        mapa[item.data] = {
          itens: [],
          resumo: {
            pendente: 0,
            confirmado: 0,
            concluido: 0,
            faltou: 0,
            cancelado: 0
          }
        }
      }

      mapa[item.data].itens.push(item)

      if (mapa[item.data].resumo[item.status] !== undefined) {
        mapa[item.data].resumo[item.status]++
      }
    })

    return mapa
  }, [agendamentosCalendarioFiltrados])

  const agendamentosDiaSelecionadoCalendario =
    mapaAgendamentosPorDia[diaCalendarioSelecionado]?.itens || []

  const diasMesCalendario = useMemo(() => {
    return getMonthGrid(criarDataLocal(dataCalendarioBase))
  }, [dataCalendarioBase])

  const diasSemanaCalendario = useMemo(() => {
    return getWeekDays(criarDataLocal(dataCalendarioBase))
  }, [dataCalendarioBase])

  const resumoCalendario = useMemo(() => {
    return agendamentosCalendarioFiltrados.reduce(
      (acc, item) => {
        acc.total++
        if (acc[item.status] !== undefined) acc[item.status]++
        return acc
      },
      {
        total: 0,
        pendente: 0,
        confirmado: 0,
        concluido: 0,
        faltou: 0,
        cancelado: 0
      }
    )
  }, [agendamentosCalendarioFiltrados])

  function mudarPeriodoCalendario(direcao) {
    const base = criarDataLocal(dataCalendarioBase)

    if (visaoCalendario === "mensal") {
      base.setMonth(base.getMonth() + (direcao === "proximo" ? 1 : -1))
    } else if (visaoCalendario === "semanal") {
      base.setDate(base.getDate() + (direcao === "proximo" ? 7 : -7))
    } else {
      base.setDate(base.getDate() + (direcao === "proximo" ? 1 : -1))
    }

    const novaBase = formatarDataISO(base)
    setDataCalendarioBase(novaBase)
    setDiaCalendarioSelecionado(novaBase)
  }

  function abrirAgendaCalendario() {
    setAgendaModo("calendario")
    setVisaoCalendario("mensal")
    setDataCalendarioBase(hoje)
    setDiaCalendarioSelecionado(hoje)
  }

  function renderizarListaDiaCalendario() {
    return (
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-xl font-bold mb-1">
          Agendamentos de {formatarDataBR(diaCalendarioSelecionado)}
        </h2>
        <p className="text-zinc-400 text-sm mb-5">
          {agendamentosDiaSelecionadoCalendario.length} item(ns) encontrado(s)
        </p>

        {agendamentosDiaSelecionadoCalendario.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-zinc-400">
            Nenhum agendamento neste dia.
          </div>
        ) : (
          <div className="grid gap-4">
            {agendamentosDiaSelecionadoCalendario.map(item => {
              const corStatus =
                item.status === "pendente"
                  ? "border-yellow-500"
                  : item.status === "confirmado"
                  ? "border-green-500"
                  : item.status === "concluido"
                  ? "border-blue-500"
                  : item.status === "cancelado"
                  ? "border-red-500"
                  : item.status === "faltou"
                  ? "border-orange-500"
                  : "border-zinc-800"

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-950 border rounded-xl p-4 ${corStatus}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        {item.clientes?.nome || "Cliente"}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {item.servicos?.nome} • {item.barbeiros?.nome}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Pagamento:{" "}
                        <span className={item.status_pagamento === "pago" ? "text-green-400" : "text-yellow-400"}>
                          {item.status_pagamento === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-yellow-500 font-bold">{item.horario}</p>
                      <p className="text-xs text-zinc-500 capitalize">{item.status}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap items-start">
                    <StatusMenu
                      item={item}
                      statusMenuId={statusMenuId}
                      setStatusMenuId={setStatusMenuId}
                      onChange={handleStatusChange}
                    />

                    <button
                      onClick={() => abrirWhatsApp(item)}
                      className={`px-3 py-2 rounded text-black ${
                        item.lembrete_enviado ? "bg-green-500" : "bg-orange-500"
                      }`}
                    >
                      WhatsApp
                    </button>

                    <button
                      onClick={() => abrirEditarAgendamento(item)}
                      className="bg-yellow-500 text-black px-3 py-2 rounded font-semibold"
                    >
                      Editar
                    </button>

                    {item.status_pagamento === "pago" ? (
                    <button
                      disabled
                      className="bg-emerald-700 text-white px-3 py-2 rounded font-semibold opacity-80"
                    >
                      Pago
                    </button>
                  ) : (
                    <button
                      onClick={() => abrirDarBaixa(item)}
                      className="bg-green-500 text-black px-3 py-2 rounded font-semibold"
                    >
                      Dar baixa
                    </button>
                  )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <div className="md:w-64 w-full bg-zinc-900 p-4 border-b md:border-r border-zinc-800 flex md:flex-col gap-2">
        <button
          onClick={() => setAba("dashboard")}
          className={`p-2 rounded ${aba === "dashboard" ? "bg-yellow-500 text-black" : ""}`}
        >
          Dashboard
        </button>

        <button
          onClick={() => {
            setAba("agenda")
            setAgendaModo("")
          }}
          className={`p-2 rounded ${aba === "agenda" ? "bg-yellow-500 text-black" : ""}`}
        >
          Agenda
        </button>

        <button
          onClick={() => setAba("clientes")}
          className={`p-2 rounded ${aba === "clientes" ? "bg-yellow-500 text-black" : ""}`}
        >
          Clientes
        </button>

        <button
          onClick={() => setAba("menu")}
          className={`p-2 rounded ${aba === "menu" ? "bg-yellow-500 text-black" : ""}`}
        >
          Menu
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8">
        {aba === "menu" && (
          <div>
            <h1 className="text-3xl mb-6">Menu</h1>

            <div className="grid gap-4">
              <button
                onClick={() => navigate("/admin/funcionamento")}
                className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500"
              >
                Horário de Funcionamento
              </button>

              <button
                onClick={() => navigate("/admin/servicos")}
                className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500"
              >
                Gerenciar serviços
              </button>

              <button
                onClick={() => navigate("/admin/feriados")}
                className="bg-zinc-800 p-4 rounded"
              >
                Gerenciar feriados
              </button>

              <button
                onClick={() => navigate("/admin/caixa")}
                className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500"
              >
                Caixa
              </button>
            </div>
          </div>
        )}

        {aba === "dashboard" && (
          <div>
            <h1 className="text-3xl mb-6">Dashboard</h1>

            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="mb-6 p-3 bg-zinc-900 rounded"
            />

            {(() => {
              const total = agendamentosFiltrados.length
              const concluidos = agendamentosFiltrados.filter(a => a.status === "concluido").length
              const cancelados = agendamentosFiltrados.filter(a => a.status === "cancelado").length
              const confirmados = agendamentosFiltrados.filter(a => a.status === "confirmado").length
              const pendentes = agendamentosFiltrados.filter(a => a.status === "pendente").length
              const lembretesPendentes = agendamentosFiltrados.filter(a => !a.lembrete_enviado).length

              const comparecimento = total > 0 ? Math.round((concluidos / total) * 100) : 0
              const ocupacao = Math.round((total / 10) * 100)

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Card titulo="Previsto" valor={`R$ ${faturamentoPrevisto}`} cor="yellow" />
                  <Card titulo="Realizado" valor={`R$ ${faturamentoRealizado}`} cor="green" />
                  <Card titulo="Ocupação" valor={`${ocupacao}%`} />
                  <Card titulo="Comparecimento" valor={`${comparecimento}%`} cor="blue" />
                  <Card titulo="Agendamentos" valor={total} />
                  <Card titulo="Cortes realizados" valor={concluidos} cor="green" />
                  <Card titulo="Confirmados" valor={confirmados} cor="green" />
                  <Card titulo="Pendentes" valor={pendentes} cor="yellow" />
                  <Card titulo="Cancelados" valor={cancelados} cor="red" />
                  <Card titulo="Lembretes" valor={lembretesPendentes} cor="blue" />
                </div>
              )
            })()}

            <div className="mt-6 bg-zinc-900 p-5 rounded-xl">
              <p className="text-zinc-400 text-sm">Serviço mais vendido</p>
              <p className="text-lg font-bold">
                {(() => {
                  const contador = {}
                  agendamentosFiltrados.forEach(a => {
                    const nome = a.servicos?.nome
                    if (!nome) return
                    if (!contador[nome]) contador[nome] = 0
                    contador[nome]++
                  })

                  return Object.keys(contador).length > 0
                    ? Object.keys(contador).reduce((a, b) => contador[a] > contador[b] ? a : b)
                    : "-"
                })()}
              </p>
            </div>

            <div className="mt-6 bg-zinc-900 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-4">Faturamento últimos 7 dias</h2>
              <GraficoSemanal dataSelecionada={dataSelecionada} />
            </div>

            {aniversariantesHoje.length > 0 && (
              <div className="bg-zinc-900 border border-yellow-500 p-4 rounded-xl mb-6 mt-6">
                <h2 className="text-yellow-500 font-bold mb-2">🎂 Aniversariantes de hoje</h2>
                {aniversariantesHoje.map(cliente => (
                  <div key={cliente.id} className="flex justify-between text-sm">
                    <span>{cliente.nome}</span>
                    <span className="text-zinc-400">
                      {calcularIdade(cliente.nascimento)} anos
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aba === "agenda" && (
          <div>
            {!agendaModo && (
              <div>
                <h1 className="text-3xl mb-2">Agenda</h1>
                <p className="text-zinc-400 mb-8">
                  Escolha como deseja visualizar os agendamentos
                </p>

                <div className="grid md:grid-cols-2 gap-5">
                  <button
                    onClick={() => setAgendaModo("padrao")}
                    className="text-left bg-zinc-900 border border-zinc-800 hover:border-yellow-500 rounded-2xl p-6 transition"
                  >
                    <div className="text-4xl mb-4">📋</div>
                    <h2 className="text-xl font-bold mb-2 text-yellow-500">
                      Agenda padrão
                    </h2>
                    <p className="text-zinc-300 mb-4">
                      Veja os horários em lista, do jeito que já funciona hoje.
                    </p>
                    <div className="text-sm text-zinc-500">
                      Melhor para operação rápida do dia a dia.
                    </div>
                  </button>

                  <button
                    onClick={abrirAgendaCalendario}
                    className="text-left bg-zinc-900 border border-zinc-800 hover:border-yellow-500 rounded-2xl p-6 transition"
                  >
                    <div className="text-4xl mb-4">📅</div>
                    <h2 className="text-xl font-bold mb-2 text-yellow-500">
                      Agenda calendário
                    </h2>
                    <p className="text-zinc-300 mb-4">
                      Veja mensalmente, semanalmente e diariamente em uma visão mais visual.
                    </p>
                    <div className="text-sm text-zinc-500">
                      Melhor para organização, planejamento e consulta rápida.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {agendaModo === "padrao" && (
              <div>
                <button
                  onClick={() => setAgendaModo("")}
                  className="text-zinc-400 hover:text-white mb-4"
                >
                  ← Voltar para escolha
                </button>

                <h1 className="text-3xl mb-6">Agenda padrão</h1>

                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="mb-6 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
                />

                <div className="flex flex-wrap gap-3 mb-6">
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="p-2 bg-zinc-900 rounded"
                  >
                    <option value="">Todos status</option>
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="faltou">Faltou</option>
                  </select>

                  <select
                    value={filtroBarbeiro}
                    onChange={(e) => setFiltroBarbeiro(e.target.value)}
                    className="p-2 bg-zinc-900 rounded"
                  >
                    <option value="">Todos barbeiros</option>
                    {barbeirosUnicos.map((b, i) => (
                      <option key={i}>{b}</option>
                    ))}
                  </select>

                  <select
                    value={filtroLembrete}
                    onChange={(e) => setFiltroLembrete(e.target.value)}
                    className="p-2 bg-zinc-900 rounded"
                  >
                    <option value="">Todos lembretes</option>
                    <option value="pendente">Lembretes pendentes</option>
                    <option value="enviado">Lembretes enviados</option>
                  </select>
                </div>

                {agendamentosFiltrados
                  .filter(item =>
                    filtroStatus === "cancelado"
                      ? item.status === "cancelado"
                      : item.status !== "cancelado"
                  )
                  .map(item => {
                    const corStatus =
                      item.status === "pendente"
                        ? "border-yellow-500"
                        : item.status === "confirmado"
                        ? "border-green-500"
                        : item.status === "concluido"
                        ? "border-blue-500"
                        : item.status === "cancelado"
                        ? "border-red-500"
                        : "border-zinc-800"

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-zinc-900 p-5 mb-4 rounded-xl border ${corStatus}`}
                      >
                        {proximo?.id === item.id && (
                          <p className="text-green-400 text-xs mb-2">
                            ⏱ Próximo atendimento
                          </p>
                        )}

                        <div className="flex justify-between">
                          <div>
                            <p className="font-bold">{item.clientes?.nome}</p>
                            <p className="text-sm text-zinc-400">
                              {item.servicos?.nome} • {item.barbeiros?.nome}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                            Pagamento:{" "}
                            <span className={item.status_pagamento === "pago" ? "text-green-400" : "text-yellow-400"}>
                              {item.status_pagamento === "pago" ? "Pago" : "Pendente"}
                            </span>
                          </p>
                          </div>

                          <div className="text-right">
                            <p className="text-yellow-500 font-bold">{item.horario}</p>
                            <p className="text-xs text-zinc-500">{item.data}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 flex-wrap items-start">
                          <StatusMenu
                            item={item}
                            statusMenuId={statusMenuId}
                            setStatusMenuId={setStatusMenuId}
                            onChange={handleStatusChange}
                          />

                          <button
                            onClick={() => abrirWhatsApp(item)}
                            className={`px-3 py-2 rounded text-black ${
                              item.lembrete_enviado ? "bg-green-500" : "bg-orange-500"
                            }`}
                          >
                            WhatsApp
                          </button>

                          <button
                            onClick={() => abrirEditarAgendamento(item)}
                            className="bg-yellow-500 text-black px-3 py-2 rounded font-semibold"
                          >
                            Editar
                          </button>

                          {item.status_pagamento === "pago" ? (
                          <button
                            disabled
                            className="bg-emerald-700 text-white px-3 py-2 rounded font-semibold opacity-80"
                          >
                            Pago
                          </button>
                        ) : (
                          <button
                            onClick={() => abrirDarBaixa(item)}
                            className="bg-green-500 text-black px-3 py-2 rounded font-semibold"
                          >
                            Dar baixa
                          </button>
                        )}
                        </div>
                      </motion.div>
                    )
                  })}

                {horariosDisponiveis.length > 0 && (
                  <div className="mt-6">
                    <p className="text-zinc-500 text-sm mb-2">Horários disponíveis</p>

                    {horariosDisponiveis.map((hora) => (
                      <div
                        key={hora}
                        className="bg-zinc-900 p-5 mb-3 rounded-xl border border-zinc-800 opacity-60"
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="text-zinc-400 text-sm">Disponível</p>
                          </div>
                          <div className="text-yellow-500 font-bold">{hora}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {agendaModo === "calendario" && (
              <div>
                <button
                  onClick={() => setAgendaModo("")}
                  className="text-zinc-400 hover:text-white mb-4"
                >
                  ← Voltar para escolha
                </button>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h1 className="text-3xl mb-2">Agenda calendário</h1>
                    <p className="text-zinc-400">
                      Veja por mês, semana ou dia e clique para abrir os agendamentos
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setVisaoCalendario("mensal")}
                      className={`px-4 py-2 rounded-xl border ${
                        visaoCalendario === "mensal"
                          ? "bg-yellow-500 text-black border-yellow-500"
                          : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
                      }`}
                    >
                      Mensal
                    </button>

                    <button
                      onClick={() => setVisaoCalendario("semanal")}
                      className={`px-4 py-2 rounded-xl border ${
                        visaoCalendario === "semanal"
                          ? "bg-yellow-500 text-black border-yellow-500"
                          : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
                      }`}
                    >
                      Semanal
                    </button>

                    <button
                      onClick={() => setVisaoCalendario("diario")}
                      className={`px-4 py-2 rounded-xl border ${
                        visaoCalendario === "diario"
                          ? "bg-yellow-500 text-black border-yellow-500"
                          : "bg-zinc-900 border-zinc-800 hover:border-yellow-500"
                      }`}
                    >
                      Diário
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                  <ResumoCard titulo="Total" valor={resumoCalendario.total} cor="yellow" />
                  <ResumoCard titulo="Pendentes" valor={resumoCalendario.pendente} cor="yellow" />
                  <ResumoCard titulo="Confirmados" valor={resumoCalendario.confirmado} cor="green" />
                  <ResumoCard titulo="Concluídos" valor={resumoCalendario.concluido} cor="blue" />
                  <ResumoCard titulo="Faltou" valor={resumoCalendario.faltou} cor="orange" />
                  <ResumoCard titulo="Cancelados" valor={resumoCalendario.cancelado} cor="red" />
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <select
                    value={filtroCalendarioBarbeiro}
                    onChange={(e) => setFiltroCalendarioBarbeiro(e.target.value)}
                    className="p-2 bg-zinc-900 rounded border border-zinc-800"
                  >
                    <option value="">Todos barbeiros</option>
                    {barbeirosCalendarioUnicos.map((b, i) => (
                      <option key={i}>{b}</option>
                    ))}
                  </select>

                  <select
                    value={filtroCalendarioStatus}
                    onChange={(e) => setFiltroCalendarioStatus(e.target.value)}
                    className="p-2 bg-zinc-900 rounded border border-zinc-800"
                  >
                    <option value="">Todos status</option>
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="faltou">Faltou</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 mb-6">
                  <button
                    onClick={() => mudarPeriodoCalendario("anterior")}
                    className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl hover:border-yellow-500"
                  >
                    ←
                  </button>

                  <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-center font-semibold flex-1">
                    {tituloPeriodoCalendario(visaoCalendario, criarDataLocal(dataCalendarioBase))}
                  </div>

                  <button
                    onClick={() => mudarPeriodoCalendario("proximo")}
                    className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl hover:border-yellow-500"
                  >
                    →
                  </button>
                </div>

                {visaoCalendario === "mensal" && (
                  <>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
                      <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs md:text-sm text-zinc-500">
                        <div>Dom</div>
                        <div>Seg</div>
                        <div>Ter</div>
                        <div>Qua</div>
                        <div>Qui</div>
                        <div>Sex</div>
                        <div>Sáb</div>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {diasMesCalendario.map((dia, index) => {
                          const iso = dia ? formatarDataISO(dia) : null
                          const quantidade = iso ? (mapaAgendamentosPorDia[iso]?.itens?.length || 0) : 0
                          const resumo = iso ? mapaAgendamentosPorDia[iso]?.resumo : null

                          return (
                            <DiaCardCalendario
                              key={iso || `vazio-${index}`}
                              data={dia}
                              hoje={hoje}
                              selecionado={iso === diaCalendarioSelecionado}
                              quantidade={quantidade}
                              resumo={resumo}
                              onClick={setDiaCalendarioSelecionado}
                            />
                          )
                        })}
                      </div>
                    </div>

                    {renderizarListaDiaCalendario()}
                  </>
                )}

                {visaoCalendario === "semanal" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                      {diasSemanaCalendario.map((dia) => {
                        const iso = formatarDataISO(dia)
                        const quantidade = mapaAgendamentosPorDia[iso]?.itens?.length || 0
                        const resumo = mapaAgendamentosPorDia[iso]?.resumo

                        return (
                          <div key={iso} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                            <p className="text-xs text-zinc-500 mb-2">
                              {dia.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                            </p>

                            <DiaCardCalendario
                              data={dia}
                              hoje={hoje}
                              selecionado={iso === diaCalendarioSelecionado}
                              quantidade={quantidade}
                              resumo={resumo}
                              onClick={setDiaCalendarioSelecionado}
                              compacto
                            />
                          </div>
                        )
                      })}
                    </div>

                    {renderizarListaDiaCalendario()}
                  </>
                )}

                {visaoCalendario === "diario" && (
                  <>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-zinc-500 text-sm">Dia selecionado</p>
                          <h2 className="text-2xl font-bold text-yellow-500">
                            {formatarDataBR(diaCalendarioSelecionado)}
                          </h2>
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
                          <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-300">
                            Total: {agendamentosDiaSelecionadoCalendario.length}
                          </div>
                          <StatusDots resumo={mapaAgendamentosPorDia[diaCalendarioSelecionado]?.resumo} />
                        </div>
                      </div>
                    </div>

                    {renderizarListaDiaCalendario()}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {aba === "clientes" && (
          <div>
            <h1 className="text-3xl mb-6">Clientes</h1>

            <input
              type="text"
              placeholder="Buscar por nome ou telefone"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full md:w-[380px] mb-6 p-3 bg-zinc-900 rounded-xl border border-zinc-800 outline-none"
            />

            <div className="grid gap-4">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => abrirCliente(cliente)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-yellow-500 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{cliente.nome}</p>
                        <p className="text-sm text-zinc-400">
                          {cliente.telefone || "Sem telefone"}
                        </p>
                      </div>

                      <button className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm font-semibold">
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-400">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          </div>
        )}

        {modalCliente && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 w-full max-w-4xl rounded-2xl p-6 border border-zinc-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{modalCliente.nome}</h2>
                  <p className="text-zinc-400 text-sm">Detalhes do cliente</p>
                </div>

                <button
                  onClick={() => {
                    setModalCliente(null)
                    setEditando(false)
                    setHistorico([])
                  }}
                  className="bg-red-500 px-3 py-1 rounded-lg"
                >
                  Fechar
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm mb-1">Nome</p>

                  {editando ? (
                    <input
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    />
                  ) : (
                    <p className="font-bold">{modalCliente.nome}</p>
                  )}
                </div>

                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm mb-1">Telefone</p>

                  {editando ? (
                    <input
                      value={telefoneEditado}
                      onChange={(e) => setTelefoneEditado(e.target.value)}
                      className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    />
                  ) : (
                    <p className="font-bold">{modalCliente.telefone || "Sem telefone"}</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 mb-4">
                <p className="text-zinc-400 text-sm mb-1">Nascimento</p>

                {editando ? (
                  <input
                    type="date"
                    value={nascimentoEditado}
                    onChange={(e) => setNascimentoEditado(e.target.value)}
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                  />
                ) : (
                  <p className="font-bold">
                    {formatarDataComIdade(modalCliente.nascimento)}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mb-6 flex-wrap">
                {!editando ? (
                  <button
                    onClick={() => setEditando(true)}
                    className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold"
                  >
                    Editar cliente
                  </button>
                ) : (
                  <>
                    <button
                      onClick={salvarCliente}
                      className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold"
                    >
                      Salvar
                    </button>

                    <button
                      onClick={() => {
                        setEditando(false)
                        setNomeEditado(modalCliente.nome || "")
                        setTelefoneEditado(modalCliente.telefone || "")
                        setNascimentoEditado(modalCliente.nascimento || "")
                      }}
                      className="bg-zinc-700 px-4 py-2 rounded-lg"
                    >
                      Cancelar edição
                    </button>
                  </>
                )}
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Total gasto</p>
                  <p className="text-xl font-bold text-green-500">R$ {totalGastoCliente}</p>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Agendamentos</p>
                  <p className="text-xl font-bold">{totalAgendamentosCliente}</p>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Corte mais realizado</p>
                  <p className="text-xl font-bold">{corteMaisFeitoCliente}</p>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Concluídos</p>
                  <p className="text-xl font-bold text-blue-500">{totalConcluidosCliente}</p>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Cancelados</p>
                  <p className="text-xl font-bold text-red-500">{totalCanceladosCliente}</p>
                </div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 mb-6">
                <p className="text-sm text-zinc-400 mb-1">Barbeiro mais frequente</p>
                <p className="text-lg font-bold">{barbeiroMaisFrequente}</p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-4">Histórico de agendamentos</h3>

                <div className="grid gap-3">
                  {historico.length > 0 ? (
                    historico.map((item) => {
                      const corStatus =
                        item.status === "pendente"
                          ? "border-yellow-500"
                          : item.status === "confirmado"
                          ? "border-green-500"
                          : item.status === "concluido"
                          ? "border-blue-500"
                          : item.status === "cancelado"
                          ? "border-red-500"
                          : "border-zinc-800"

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-3 ${corStatus}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{item.servicos?.nome || "Serviço"}</p>
                              <p className="text-sm text-zinc-400">
                                {item.data} • {item.horario}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {item.barbeiros?.nome || "Sem barbeiro"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm capitalize">{item.status}</p>
                              <p className="text-yellow-500 font-bold">
                                R$ {item.servicos?.preco || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-zinc-400">Nenhum histórico encontrado.</p>
                  )}
                </div>
              </div>
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
                {servicos.map(s => (
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
                {horariosEdicao.map(h => (
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
        <DarBaixaModal
  aberto={darBaixaAberto}
  agendamento={agendamentoBaixa}
  onClose={() => {
    setDarBaixaAberto(false)
    setAgendamentoBaixa(null)
  }}
  onSuccess={() => {
    buscar()
    carregarAgendamentosCalendario()
  }}
/>
      </div>
    </div>
  )
}

function Card({ titulo, valor, cor }) {
  const cores = {
    yellow: "text-yellow-500",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500"
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-lg text-center">
      <p className="text-xs text-zinc-400">{titulo}</p>
      <p className={`text-lg font-bold ${cores[cor] || ""}`}>
        {valor}
      </p>
    </div>
  )
}

function ResumoCard({ titulo, valor, cor }) {
  const cores = {
    yellow: "text-yellow-500",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500",
    orange: "text-orange-500"
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-400">{titulo}</p>
      <p className={`text-xl font-bold ${cores[cor] || "text-white"}`}>
        {valor}
      </p>
    </div>
  )
}

function GraficoSemanal({ dataSelecionada }) {
  const [dados, setDados] = useState([])
  const [labels, setLabels] = useState([])

  useEffect(() => {
    carregar()
  }, [dataSelecionada])

  async function carregar() {
    const hoje = new Date(dataSelecionada + "T12:00:00")
    const resultados = []
    const novosLabels = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje)
      d.setHours(12, 0, 0, 0)
      d.setDate(hoje.getDate() - i)

      const ano = d.getFullYear()
      const mes = String(d.getMonth() + 1).padStart(2, "0")
      const dia = String(d.getDate()).padStart(2, "0")
      const dataFormatada = `${ano}-${mes}-${dia}`

      const nomeDia = d
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "")

      novosLabels.push(nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1))

      const { data } = await supabase
        .from("agendamentos")
        .select(`servicos(preco), status`)
        .eq("data", dataFormatada)

      const total =
        data
          ?.filter(a => a.status === "concluido")
          .reduce((t, a) => t + (a.servicos?.preco || 0), 0) || 0

      resultados.push(total)
    }

    setLabels(novosLabels)
    setDados(resultados)
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px] h-[260px]">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "R$",
                data: dados,
                backgroundColor: "#eab308"
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: "#a1a1aa"
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  color: "#a1a1aa"
                },
                grid: {
                  color: "rgba(255,255,255,0.05)"
                }
              },
              y: {
                ticks: {
                  color: "#a1a1aa"
                },
                grid: {
                  color: "rgba(255,255,255,0.05)"
                }
              }
            }
          }}
        />
      </div>
    </div>
  )
}