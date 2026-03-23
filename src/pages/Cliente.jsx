import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"

export default function Cliente(){

const navigate = useNavigate()
const location = useLocation()

const { servico, barbeiro, data, horario } = location.state || {}

const [telefone, setTelefone] = useState("")
const [nome, setNome] = useState("")
const [mensagem, setMensagem] = useState("")
const [mostrarModal, setMostrarModal] = useState(false)
const [salvando, setSalvando] = useState(false)

/* 🔥 NOVO ESTADO DO AVISO */
const [mostrarAviso, setMostrarAviso] = useState(false)

useEffect(() => {
  const nomeSalvo = localStorage.getItem("cliente_nome")
  const telefoneSalvo = localStorage.getItem("cliente_telefone")

  if(nomeSalvo) setNome(nomeSalvo)
  if(telefoneSalvo) setTelefone(telefoneSalvo)
}, [])


/* ================= AVISO INTELIGENTE ================= */

useEffect(() => {

const jaViu = localStorage.getItem("aviso_cliente_visto")

if(!jaViu){
setMostrarAviso(true)
}

}, [])

function fecharAviso(){
localStorage.setItem("aviso_cliente_visto", "true")
setMostrarAviso(false)
}

function formatarData(data){
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

/* ================= BUSCAR CLIENTE ================= */

useEffect(()=>{

async function buscarCliente(){

if(telefone.length < 10){
setNome("") // limpa se apagar telefone
return
}

const { data, error } = await supabase
.from("clientes")
.select("*")
.eq("telefone", telefone)
.maybeSingle()

if(error){
console.log(error)
return
}

if(data){
setNome(data.nome)
}

}

buscarCliente()

}, [telefone])


/* ================= VALIDAÇÕES ================= */

function handleTelefone(e){
let valor = e.target.value.replace(/\D/g, "")
if(valor.length <= 11){
setTelefone(valor)
}
}

function handleNome(e){
let valor = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "")
setNome(valor)
}


/* ================= CONFIRMAR ================= */

function abrirModal(){

if(!telefone || !nome){
alert("Preencha os campos obrigatórios")
return
}

setMostrarModal(true)

}


/* ================= SALVAR ================= */

async function confirmarAgendamento(){

try{

setSalvando(true)

let cliente = null

const { data: clienteExistente } = await supabase
.from("clientes")
.select("*")
.eq("telefone", telefone)
.single()

if(clienteExistente){
cliente = clienteExistente
}else{

const { data: novoCliente, error } = await supabase
.from("clientes")
.insert([{ nome, telefone }])
.select()
.single()

if(error){
alert(error.message)
setSalvando(false)
return
}

cliente = novoCliente

}

const payload = {
cliente_id: cliente.id,
data,
horario,
servico_id: servico.id,
barbeiro_id: barbeiro.id,
mensagem,
status: "pendente"
}

/* 🔥 AQUI MUDA TUDO */
const { data: novoAgendamento, error } = await supabase
.from("agendamentos")
.insert([payload])
.select()
.single()

if(error){
alert(error.message)
setSalvando(false)
return
}

/* 🔥 GARANTE ID */
if(!novoAgendamento?.id){
alert("Erro ao gerar agendamento")
return
}

const agendamentoId = novoAgendamento.id

/* 🔥 SALVA NO DISPOSITIVO */
localStorage.setItem("cliente_nome", nome)
localStorage.setItem("cliente_telefone", telefone)

alert("Agendamento realizado com sucesso! 💈")
navigate("/")


}catch(err){
alert("Erro ao salvar")
}finally{
setSalvando(false)
}

}


/* ================= UI ================= */

return(

<div className="min-h-screen bg-black text-white flex justify-center">

<motion.div
initial={{opacity:0, y:30}}
animate={{opacity:1, y:0}}
className="max-w-xl w-full p-6"
>

<button
onClick={()=>navigate(-1)}
className="text-zinc-400 mb-4"
>
← Voltar
</button>

<h1 className="text-3xl text-center mb-6">
Seus dados
</h1>


{/* 🔥 AVISO INTELIGENTE */}

{mostrarAviso && (

<div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm p-4 rounded-xl mb-6 relative">

<button
onClick={fecharAviso}
className="absolute top-2 right-3 text-yellow-300 hover:text-white"
>
✕
</button>

⚠️ No primeiro agendamento, preencha todos os campos.
<br/>
Nas próximas vezes, basta informar o telefone que seus dados serão preenchidos automaticamente.

</div>

)}


{/* TELEFONE */}

<input
  type="tel"
  name="tel"
  autoComplete="tel"
  inputMode="tel"

  placeholder="Telefone Ex: 6799999999"
  value={telefone}
  onChange={handleTelefone}

  className="w-full p-4 mb-4 bg-zinc-900 rounded-xl"
/>


{/* NOME */}

<input
placeholder="Nome completo"
value={nome}
onChange={handleNome}
className="w-full p-4 mb-4 bg-zinc-900 rounded-xl"
/>


{/* MENSAGEM */}

<textarea
placeholder="Deixe uma mensagem para o profissional"
value={mensagem}
onChange={(e)=>setMensagem(e.target.value)}
className="w-full p-4 mb-6 bg-zinc-900 rounded-xl"
/>


<button
onClick={abrirModal}
className="w-full bg-yellow-500 text-black py-4 rounded-xl"
>
Confirmar agendamento
</button>

{/* ================= MODAL ================= */}



{mostrarModal && (

<div className="fixed inset-0 bg-black/70 flex items-center justify-center">

<div className="bg-zinc-900 p-6 rounded-xl max-w-sm w-full">

<h2 className="text-xl mb-4 text-center">
Confirmar agendamento
</h2>

<p><strong>Nome:</strong> {nome}</p>
<p><strong>Telefone:</strong> {telefone}</p>
<p><strong>Serviço:</strong> {servico.nome}</p>
<p><strong>Barbeiro:</strong> {barbeiro.nome}</p>
<p><strong>Data:</strong> {formatarData(data)}</p>
<p><strong>Hora:</strong> {horario}</p>

<div className="flex gap-2 mt-6">

<button
onClick={()=>setMostrarModal(false)}
className="flex-1 bg-zinc-700 py-2 rounded"
>
Editar
</button>

<button
onClick={confirmarAgendamento}
className="flex-1 bg-yellow-500 text-black py-2 rounded"
>
{salvando ? "Salvando..." : "Confirmar"}
</button>

</div>

</div>

</div>

)}

</motion.div>

</div>

)

}