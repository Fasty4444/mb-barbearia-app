import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

import { Bar } from "react-chartjs-2"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

export default function Dashboard(){

  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [clientesHoje, setClientesHoje] = useState(0)
  const [faturamentoHoje, setFaturamentoHoje] = useState(0)
  const [faturamentoRealizado, setFaturamentoRealizado] = useState(0)
  const [servicoMaisVendido, setServicoMaisVendido] = useState("")
  const [canceladosHoje, setCanceladosHoje] = useState(0)

  const [graficoSemanal, setGraficoSemanal] = useState([])

  useEffect(() => {
    carregarDashboard()
    carregarGraficoSemanal()
  }, [])


  /* ================= DATA SEGURA ================= */

  function getHoje(){
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth()+1).padStart(2,"0")
    const dia = String(hoje.getDate()).padStart(2,"0")
    return `${ano}-${mes}-${dia}`
  }


  /* ================= DASHBOARD ================= */

  async function carregarDashboard(){

    const hoje = getHoje()

    const { data } = await supabase
      .from("agendamentos")
      .select(`
        status,
        clientes(id),
        servicos(nome,preco)
      `)
      .eq("data", hoje)

    if(!data) return

    // total
    setAgendamentosHoje(data.length)

    // clientes únicos
    const clientesUnicos = new Set(data.map(a => a.clientes?.id))
    setClientesHoje(clientesUnicos.size)

    // faturamento previsto
    const faturamento = data.reduce((total,a)=>{
      return total + (a.servicos?.preco || 0)
    },0)

    setFaturamentoHoje(faturamento)

    // faturamento realizado
    const realizado = data
      .filter(a => a.status === "concluido")
      .reduce((total,a)=>{
        return total + (a.servicos?.preco || 0)
      },0)

    setFaturamentoRealizado(realizado)

    // cancelados
    setCanceladosHoje(
      data.filter(a => a.status === "cancelado").length
    )

    // serviço mais vendido
    const contador = {}

    data.forEach(a => {

      const nome = a.servicos?.nome
      if(!nome) return

      if(!contador[nome]) contador[nome] = 0
      contador[nome]++

    })

    if(Object.keys(contador).length > 0){
      const maisVendido = Object.keys(contador).reduce((a,b)=>
        contador[a] > contador[b] ? a : b
      )
      setServicoMaisVendido(maisVendido)
    }

  }


  /* ================= GRÁFICO ================= */

  async function carregarGraficoSemanal(){

    const hoje = new Date()
    const dias = []

    for(let i=6;i>=0;i--){
      const d = new Date()
      d.setDate(hoje.getDate() - i)
      dias.push(d)
    }

    const resultados = []

    for(const dia of dias){

      const ano = dia.getFullYear()
      const mes = String(dia.getMonth()+1).padStart(2,"0")
      const diaFormat = String(dia.getDate()).padStart(2,"0")

      const dataFormatada = `${ano}-${mes}-${diaFormat}`

      const { data } = await supabase
        .from("agendamentos")
        .select(`servicos(preco), status`)
        .eq("data", dataFormatada)

      const total = data
        ?.filter(a => a.status === "concluido")
        .reduce((t,a)=>{
          return t + (a.servicos?.preco || 0)
        },0) || 0

      resultados.push(total)
    }

    setGraficoSemanal(resultados)
  }


  const dadosGrafico = {
    labels: ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"],
    datasets: [
      {
        label: "Faturamento (R$)",
        data: graficoSemanal,
        backgroundColor: "#eab308"
      }
    ]
  }


  /* ================= OCUPAÇÃO ================= */

  const ocupacao = Math.round((agendamentosHoje / 10) * 100)


  /* ================= UI ================= */

  return(

    <div className="min-h-screen bg-black text-white p-8">

      <h1 className="text-4xl font-bold mb-10">
        Dashboard
      </h1>


      {/* CARDS */}

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">

        <Card titulo="Agendamentos" valor={agendamentosHoje} />
        <Card titulo="Clientes" valor={clientesHoje} />
        <Card titulo="Previsto" valor={`R$ ${faturamentoHoje}`} cor="yellow" />
        <Card titulo="Realizado" valor={`R$ ${faturamentoRealizado}`} cor="green" />
        <Card titulo="Cancelados" valor={canceladosHoje} cor="red" />
        <Card titulo="Ocupação" valor={`${ocupacao}%`} cor="blue" />

      </div>


      {/* SERVIÇO */}

      <div className="mt-10 bg-zinc-900 p-6 rounded-xl">

        <p className="text-zinc-400">
          Serviço mais vendido
        </p>

        <p className="text-2xl font-bold">
          {servicoMaisVendido || "-"}
        </p>

      </div>


      {/* GRÁFICO */}

      <div className="mt-12 bg-zinc-900 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-4">
          Faturamento semanal
        </h2>

        <Bar data={dadosGrafico} />

      </div>

    </div>

  )
}


/* ================= COMPONENTE CARD ================= */

function Card({ titulo, valor, cor }){

  const cores = {
    yellow: "text-yellow-500",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500"
  }

  return(
    <div className="bg-zinc-900 p-6 rounded-xl hover:scale-105 transition">

      <p className="text-zinc-400">
        {titulo}
      </p>

      <p className={`text-2xl font-bold ${cores[cor] || ""}`}>
        {valor}
      </p>

    </div>
  )
}