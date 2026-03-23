import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"

export default function Data(){

const navigate = useNavigate()
const location = useLocation()

const { servico, barbeiro } = location.state || {}

const hoje = new Date()
const hojeFormatado = hoje.toISOString().split("T")[0]

const [date, setDate] = useState(hojeFormatado)
const [horariosOcupados, setHorariosOcupados] = useState([])
const [diaBloqueado, setDiaBloqueado] = useState(false)


/* ================= FUNÇÃO DATA CORRETA ================= */

function criarDataLocal(dataString){
  const [ano, mes, dia] = dataString.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

/* ================= FUNÇÃO trava hora passada ================= */
function horarioPassado(data, horario){
  const agora = new Date()

  // quebra a data (YYYY-MM-DD)
  const [ano, mes, dia] = data.split("-")

  // cria data LOCAL (importante)
  const dataSelecionada = new Date(ano, mes - 1, dia)

  const [hora, minuto] = horario.split(":")
  dataSelecionada.setHours(hora, minuto, 0, 0)

  return dataSelecionada < agora
}


/* ================= VALIDAÇÃO ================= */

useEffect(()=>{
if(!servico || !barbeiro){
navigate("/agendamento")
}
},[])


/* ================= BUSCAR HORÁRIOS ================= */

useEffect(()=>{

async function carregar(){

let query = supabase
.from("agendamentos")
.select("horario")
.eq("data", date)
.neq("status", "cancelado") // 🔥 ESSA LINHA AQUI

if(barbeiro?.id){
query = query.eq("barbeiro_id", barbeiro.id)
}

const { data, error } = await query

if(error){
console.log(error)
return
}

const { data: bloqueados } = await supabase
.from("bloqueios_horarios")
.select("horario")
.eq("data", date)

const ocupados = data?.map(i=>i.horario) || []
const bloqueadosLista = bloqueados?.map(i=>i.horario) || []

setHorariosOcupados([
  ...ocupados,
  ...bloqueadosLista
])

}

carregar()

},[date])

/* ================= VALIDAÇÃO DE BLOQUEIO ================= */
useEffect(()=>{

async function verificar(){

  const bloqueado = await verificarBloqueio(date)
  setDiaBloqueado(bloqueado)

}

verificar()

},[date])

async function verificarBloqueio(dataSelecionada){

  const { data } = await supabase
    .from("bloqueios")
    .select("*")
    .eq("data", dataSelecionada)

  return data.length > 0

}

/* ================= HORÁRIOS BASE ================= */

function obterHorarios(){

const dia = criarDataLocal(date).getDay()

// 0 = domingo
if(dia === 0) return []

// 1 = segunda
if(dia === 1){
return [
"09:00","09:35","10:10","10:45",
"11:20","11:55","12:30","13:05",
"13:40","14:15","14:50","15:25",
"16:00","16:35","17:10","17:45",
"18:20"
]
}

// 2 = terça
if(dia === 2){
return [
"08:30","09:05","09:40","10:15",
"10:50","11:25","12:00","12:35",
"13:10","13:45","14:20","14:55",
"15:30","16:05","16:40","17:15",
"17:50","18:25"
]
}

// 3 = quarta
if(dia === 3){
return [
"08:30","09:05","09:40","10:15",
"10:50","11:25","12:00","12:35",
"13:10","13:45","14:20","14:55",
"15:30","16:05","16:40","17:15"
]
}

// 4 = quinta
if(dia === 4){
return [
"08:30","09:05","09:40","10:15",
"10:50","11:25","12:00","12:35",
"13:10","13:45","14:20","14:55",
"15:30","16:05","16:40","17:15",
"17:50","18:25"
]
}

// 5 = sexta
if(dia === 5){
return [
"08:30","09:05","09:40","10:15",
"10:50","11:25","12:00","12:35",
"13:10","13:45","14:20","14:55",
"15:30","16:05","16:40","17:15",
"17:50","18:25"
]
}

// 6 = sábado
if(dia === 6){
return [
"08:00","08:35","09:10","09:45",
"10:20","10:55","11:30","12:05",
"12:40","13:15","13:50","14:25",
"15:00","15:35","16:10","16:45",
"17:20","17:55"
]
}

return []
}


/* ================= BLOQUEAR HORÁRIOS PASSADOS ================= */

function filtrarHorariosPassados(horarios){

const agora = new Date()
const dataSelecionada = criarDataLocal(date)

const mesmoDia = agora.toDateString() === dataSelecionada.toDateString()

if(!mesmoDia) return horarios

return horarios.filter((hora)=>{

const [h,m] = hora.split(":")

const horarioData = criarDataLocal(date)

horarioData.setHours(parseInt(h))
horarioData.setMinutes(parseInt(m))
horarioData.setSeconds(0)

return horarioData > agora

})

}


/* ================= DISPONÍVEIS ================= */

function obterDisponiveis(){

return filtrarHorariosPassados(obterHorarios())
.filter(h => !horariosOcupados.includes(h))

}


const domingo = criarDataLocal(date).getDay() === 0
const horarios = diaBloqueado ? [] : obterDisponiveis()


/* ================= UI ================= */

return(

<div className="min-h-screen bg-black text-white flex justify-center">

<motion.div
initial={{opacity:0, y:30}}
animate={{opacity:1, y:0}}
className="max-w-xl w-full p-6"
>

{/* TOPO */}

<button
onClick={()=>navigate("/agendamento")}
className="text-zinc-400 hover:text-white mb-4"
>
← Voltar
</button>


<h1 className="text-3xl font-bold text-center mb-6">
Escolha o horário
</h1>


{/* DATA */}

<input
type="date"
value={date}
min={hojeFormatado}
onChange={(e)=>setDate(e.target.value)}
className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-8"
/>


{/* DOMINGO */}

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


{/* HORÁRIOS */}

{!domingo && (

<>

<h2 className="text-center mb-6">
Horários para {criarDataLocal(date).toLocaleDateString("pt-BR")}
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