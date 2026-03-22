import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Cancelar(){

const [searchParams] = useSearchParams()
const [status, setStatus] = useState("carregando")

const id = searchParams.get("id")

useEffect(()=>{

async function cancelar(){

if(!id){
setStatus("erro")
return
}

const { error } = await supabase
.from("agendamentos")
.update({ status: "cancelado" })
.eq("id", id)

if(error){
setStatus("erro")
}else{
setStatus("cancelado")
}

}

cancelar()

}, [id])

return(

<div className="min-h-screen bg-black text-white flex items-center justify-center">

{status === "carregando" && <p>Processando...</p>}

{status === "cancelado" && (
<div className="text-center">
<h1 className="text-2xl text-red-500">❌ Agendamento cancelado</h1>
<p className="mt-2">Seu horário foi cancelado</p>
</div>
)}

{status === "erro" && (
<p className="text-red-500">Erro ao cancelar</p>
)}

</div>

)

}