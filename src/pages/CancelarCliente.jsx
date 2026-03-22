import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"

export default function CancelarCliente(){

const navigate = useNavigate()

const [telefone, setTelefone] = useState("")
const [agendamento, setAgendamento] = useState(null)

useEffect(() => {
  const telefoneSalvo = localStorage.getItem("cliente_telefone")
  if (telefoneSalvo) setTelefone(telefoneSalvo)
}, [])

/* ================= BUSCAR ================= */

async function buscar(){

  const telefoneLimpo = telefone.replace(/\D/g, "")

  const { data } = await supabase
    .from("agendamentos")
    .select(`
      id,
      data,
      horario,
      status,
      clientes(nome, telefone),
      servicos(nome),
      barbeiros(nome)
    `)
    .eq("clientes.telefone", telefoneLimpo)
    .in("status", ["pendente", "confirmado"])
    .limit(1)

  setAgendamento(data?.[0] || null)
}

/* ================= CANCELAR ================= */

async function cancelar(id){

  const confirmar = confirm("Deseja cancelar o agendamento?")

  if(!confirmar) return

  await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id)

  alert("Agendamento cancelado!")

  setAgendamento(null)
}

return(

<div className="min-h-screen bg-black text-white flex flex-col items-center p-6">

<button
onClick={()=>navigate("/")}
className="self-start text-zinc-400 mb-6"
>
← Voltar
</button>

<h1 className="text-3xl mb-6">
Cancelar agendamento
</h1>

<input
type="text"
placeholder="Digite seu telefone"
value={telefone}
onChange={(e)=>setTelefone(e.target.value)}
className="w-full max-w-md p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4"
/>

<button
onClick={buscar}
className="w-full max-w-md bg-yellow-500 text-black p-4 rounded-xl mb-6"
>
Buscar agendamento
</button>

{agendamento ? (

<div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md border border-zinc-800">

<p className="font-bold text-lg mb-2">
{agendamento.clientes?.nome}
</p>

<p className="text-zinc-400">
{agendamento.data} • {agendamento.horario}
</p>

<p>{agendamento.servicos?.nome}</p>

<p className="text-sm text-zinc-500 mb-4">
{agendamento.barbeiros?.nome}
</p>

<button
onClick={()=>cancelar(agendamento.id)}
className="bg-red-500 px-4 py-2 rounded w-full"
>
Cancelar agendamento
</button>

</div>

) : (

<p className="text-zinc-400">
Digite seu telefone para buscar
</p>

)}

</div>

)

}