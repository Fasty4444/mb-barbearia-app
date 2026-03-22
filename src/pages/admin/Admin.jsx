import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { obterHorariosPorData } from "../../utils/horarios"
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

export default function Admin() {
  const [aba, setAba] = useState("dashboard")
  const [agendamentos, setAgendamentos] = useState([])
  const hoje = new Date().toISOString().split("T")[0]
  const [dataSelecionada, setDataSelecionada] = useState(hoje)
  const [clientes, setClientes] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("")
  const [filtroLembrete, setFiltroLembrete] = useState("")
  const [modalCliente, setModalCliente] = useState(null)
  const [editando, setEditando] = useState(false)
  const [nomeEditado, setNomeEditado] = useState("")
  const [telefoneEditado, setTelefoneEditado] = useState("")
  const [subAba, setSubAba] = useState("")
  const [horarioSelecionado, setHorarioSelecionado] = useState("")
const [modoBloqueio, setModoBloqueio] = useState("dia") // "dia" ou "horario"
  

  /* ================= abrir modal ================= */

  async function abrirCliente(cliente){

  console.log("CLIENTE ORIGINAL:", cliente)

  setModalCliente({
    id: String(cliente.id), // força string correta
    nome: cliente.nome,
    telefone: cliente.telefone
  })

  setNomeEditado(cliente.nome || "")
  setTelefoneEditado(cliente.telefone || "")

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

  /* ================= salvar edição ================= */

  async function salvarCliente(){

  const id = String(modalCliente.id).trim()

  console.log("ID FINAL:", id)

  const { data, error } = await supabase
    .from("clientes")
    .update({
      nome: nomeEditado,
      telefone: telefoneEditado
    })
    .eq("id", id)
    .select()

  console.log("RESULT:", data)
  console.log("ERROR:", error)

  if(data && data.length > 0){
    setModalCliente({
      ...modalCliente,
      nome: nomeEditado,
      telefone: telefoneEditado
    })
  }

  setEditando(false)
  buscarClientes()
}

  /* ================= BUSCAR ================= */

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

  useEffect(() => {
    buscar()
  }, [dataSelecionada])

  async function bloquearDia(){

  const { error } = await supabase
    .from("bloqueios")
    .insert({
      data: dataSelecionada
    })

  if(error){
    console.log(error)
    alert("Erro ao bloquear dia")
    return
  }

  alert("Dia bloqueado com sucesso!")

}

async function bloquearHorario(){

  if(!horarioSelecionado){
    alert("Selecione um horário")
    return
  }

  const { error } = await supabase
    .from("bloqueios_horarios")
    .insert({
      data: dataSelecionada,
      horario: horarioSelecionado
    })

  if(error){
    console.log(error)
    alert("Erro ao bloquear horário")
    return
  }

  alert("Horário bloqueado com sucesso!")
}

  /* ================= STATUS ================= */

  async function atualizarStatus(id, status) {
    await supabase
      .from("agendamentos")
      .update({ status })
      .eq("id", id)

    buscar()
  }

  /* ================= FORMATAR DATA ================= */

  function formatarData(data) {
    const [ano, mes, dia] = data.split("-")
    return `${dia}/${mes}/${ano}`
  }

  /* ================= WHATSAPP ================= */

  async function abrirWhatsApp(item) {
    const numero = item.clientes?.telefone?.replace(/\D/g, "")

    if (!numero) return

    if (!item.lembrete_enviado) {
      const baseUrl = window.location.origin

      const linkConfirmar = `${baseUrl}/confirmar?id=${item.id}`
      const linkCancelar = `${baseUrl}/cancelar?id=${item.id}`

      const mensagem =
`Olá ${item.clientes?.nome}!

Você tem um horário na MB Barbearia 💈

📅 ${formatarData(item.data)}
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
      window.open(
        `https://wa.me/55${numero}`,
        "_blank"
      )
    }

    buscar()
  }

  /* ================= CLIENTES ================= */

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

  /* ================= HISTÓRICO ================= */

  async function carregarHistorico(clienteId) {
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
      .eq("cliente_id", clienteId)

    setHistorico(data || [])
  }

  /* ================= FILTROS ================= */

  const filtro = dataSelecionada || hoje

  const agendamentosFiltrados = agendamentos
    .filter(a => a.data === filtro)
    .filter(a => !filtroStatus || a.status === filtroStatus)
    .filter(a => !filtroBarbeiro || a.barbeiros?.nome === filtroBarbeiro)
    .filter(a => {
      if (filtroLembrete === "pendente") {
        return !a.lembrete_enviado
      }
      if (filtroLembrete === "enviado") {
        return a.lembrete_enviado
      }
      return true
    })

  /* ================= FATURAMENTO ================= */

  const faturamentoPrevisto = agendamentosFiltrados.reduce((acc, item) => {
    return acc + (item.servicos?.preco || 0)
  }, 0)

  const faturamentoRealizado = agendamentosFiltrados
    .filter(a => a.status === "concluido")
    .reduce((acc, item) => {
      return acc + (item.servicos?.preco || 0)
    }, 0)

  /* ================= BARBEIROS ================= */

  const barbeirosUnicos = [
    ...new Set(agendamentos.map(a => a.barbeiros?.nome).filter(Boolean))
  ]

  /* ================= PRÓXIMO ================= */

  function isProximoHorario(item) {
    const agora = new Date()
    const dataHora = new Date(`${item.data}T${item.horario}`)
    return dataHora > agora && item.status !== "cancelado"
  }

  const proximo = agendamentosFiltrados
    .filter(item => item.status !== "cancelado")
    .find(isProximoHorario)

  /* ================= CLIENTES FILTRADOS ================= */

  const clientesFiltrados = clientes.filter(cliente => {
    const termo = busca.toLowerCase()
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.telefone?.toLowerCase().includes(termo)
    )
  })

  /* ================= MÉTRICAS DO CLIENTE ================= */

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

  /* ================= LAYOUT ================= */

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* MENU */}
      <div className="md:w-64 w-full bg-zinc-900 p-4 border-b md:border-r border-zinc-800 flex md:flex-col gap-2">
        <button
          onClick={() => setAba("dashboard")}
          className={`p-2 rounded ${aba === "dashboard" ? "bg-yellow-500 text-black" : ""}`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setAba("agenda")}
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
          onClick={()=>{
  setAba("menu")
  setSubAba("") // 🔥 isso aqui é importante
}}
          className={`p-2 rounded ${aba==="menu" ? "bg-yellow-500 text-black" : ""}`}
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
onClick={()=>setSubAba("bloqueio")}
className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500"
>
Bloquear dia / Horário
</button>

</div>

</div>

)}
        {/* ================= DASHBOARD ================= */}
        {aba === "dashboard" && (
          <div>
            <h1 className="text-3xl mb-6">Dashboard</h1>

            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="mb-6 p-3 bg-zinc-900 rounded"
            />

            {/* ================= MÉTRICAS ================= */}
            {(() => {
              const total = agendamentosFiltrados.length
              const concluidos = agendamentosFiltrados.filter(a => a.status === "concluido").length
              const cancelados = agendamentosFiltrados.filter(a => a.status === "cancelado").length
              const confirmados = agendamentosFiltrados.filter(a => a.status === "confirmado").length
              const pendentes = agendamentosFiltrados.filter(a => a.status === "pendente").length
              const lembretesPendentes = agendamentosFiltrados.filter(a => !a.lembrete_enviado).length

              const comparecimento = total > 0
                ? Math.round((concluidos / total) * 100)
                : 0

              const ocupacao = Math.round((total / 10) * 100)

              const contador = {}

              agendamentosFiltrados.forEach(a => {
                const nome = a.servicos?.nome
                if (!nome) return
                if (!contador[nome]) contador[nome] = 0
                contador[nome]++
              })

              const maisVendido = Object.keys(contador).length > 0
                ? Object.keys(contador).reduce((a, b) => contador[a] > contador[b] ? a : b)
                : "-"

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

            {/* ================= SERVIÇO ================= */}
            <div className="mt-6 bg-zinc-900 p-5 rounded-xl">
              <p className="text-zinc-400 text-sm">
                Serviço mais vendido
              </p>

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

            {/* ================= GRÁFICO ================= */}
            <div className="mt-6 bg-zinc-900 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-4">
                Faturamento últimos 7 dias
              </h2>

              <GraficoSemanal dataSelecionada={dataSelecionada} />
            </div>
          </div>
        )}

        {/* ================= AGENDA ================= */}
        {aba === "agenda" && (
          <div>
            <h1 className="text-3xl mb-6">Agenda</h1>

            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="mb-6 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
            />

            {/* FILTROS */}
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
              .filter(item => filtroStatus === "cancelado" ? item.status === "cancelado" : item.status !== "cancelado")
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
                      </div>

                      <div className="text-right">
                        <p className="text-yellow-500 font-bold">{item.horario}</p>
                        <p className="text-xs text-zinc-500">{item.data}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={() => atualizarStatus(item.id, "confirmado")}
                        className="bg-green-500 text-black px-3 py-1 rounded"
                      >
                        Confirmar
                      </button>

                      <button
                        onClick={() => atualizarStatus(item.id, "concluido")}
                        className="bg-blue-500 px-3 py-1 rounded"
                      >
                        Concluir
                      </button>

                      <button
                        onClick={() => atualizarStatus(item.id, "cancelado")}
                        className="bg-red-500 px-3 py-1 rounded"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={() => abrirWhatsApp(item)}
                        className={`px-3 py-1 rounded text-black ${
                          item.lembrete_enviado ? "bg-green-500" : "bg-orange-500"
                        }`}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        )}
{/* ================= menu ================= */}
{aba === "menu" && subAba === "bloqueio" && (

<div className="max-h-[80vh] overflow-y-auto pr-2">

<button
onClick={()=>setSubAba("")}
className="text-zinc-400 mb-4"
>
← Voltar
</button>

<h1 className="text-2xl mb-6">Bloquear dia / horário</h1>

<div className="flex gap-2 mb-4">

<button
onClick={()=>setModoBloqueio("dia")}
className={`px-3 py-2 rounded ${modoBloqueio==="dia" ? "bg-yellow-500 text-black" : "bg-zinc-800"}`}
>
Dia inteiro
</button>

<button
onClick={()=>setModoBloqueio("horario")}
className={`px-3 py-2 rounded ${modoBloqueio==="horario" ? "bg-yellow-500 text-black" : "bg-zinc-800"}`}
>
Horário específico
</button>

</div>

<input
type="date"
value={dataSelecionada}
onChange={(e)=>setDataSelecionada(e.target.value)}
className="p-3 bg-zinc-900 rounded mb-4 w-full"
/>

{modoBloqueio === "horario" && (

<select
value={horarioSelecionado}
onChange={(e)=>setHorarioSelecionado(e.target.value)}
className="p-3 bg-zinc-900 rounded mb-4 w-full"
size={6}
>
<option value="">Selecione um horário</option>

{obterHorariosPorData(dataSelecionada).map(h=>(
<option key={h}>{h}</option>
))}

</select>

)}

<button
onClick={()=>{
  if(modoBloqueio === "dia"){
    bloquearDia()
  }else{
    bloquearHorario()
  }
}}
className="bg-red-500 px-4 py-2 rounded w-full"
>
{modoBloqueio === "dia"
  ? "Bloquear dia inteiro"
  : "Bloquear horário"}
</button>

</div>

)}

        {/* ================= CLIENTES ================= */}
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

        {/* ================= MODAL CLIENTE ================= */}
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
                    setClienteSelecionado(null)
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

      const nomeDia = d.toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "")

      novosLabels.push(nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1))

      const { data } = await supabase
        .from("agendamentos")
        .select(`servicos(preco), status`)
        .eq("data", dataFormatada)

      const total = data
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