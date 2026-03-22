import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Confirmar(){

const [searchParams] = useSearchParams()
const [status, setStatus] = useState("carregando")

const id = searchParams.get("id")

useEffect(()=>{

async function confirmar(){

if(!id){
setStatus("erro")
return
}

const { error } = await supabase
.from("agendamentos")
.update({ status: "confirmado" })
.eq("id", id)

if(error){
setStatus("erro")
}else{
setStatus("confirmado")
}

}

confirmar()

}, [id])

return(

<div className="min-h-screen bg-black text-white flex items-center justify-center">

{status === "carregando" && <p>Confirmando...</p>}

{status === "confirmado" && (
<div className="text-center">
<h1 className="text-2xl text-green-500">✔ Agendamento confirmado!</h1>
<p className="mt-2">Obrigado pela confirmação 💈</p>
</div>
)}

{status === "erro" && (
<p className="text-red-500">Erro ao confirmar</p>
)}

</div>

)

}