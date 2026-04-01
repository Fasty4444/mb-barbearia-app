import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"
import { pedirPermissaoPush, vincularClienteOneSignal } from "../lib/onesignal"

export default function Cliente(){

const navigate = useNavigate()
const location = useLocation()
const { servico, barbeiro, data, horario } = location.state || {}
const [telefone, setTelefone] = useState("")
const [nome, setNome] = useState("")
const [mensagem, setMensagem] = useState("")
const [mostrarModal, setMostrarModal] = useState(false)
const [salvando, setSalvando] = useState(false)
const [nascimento, setNascimento] = useState("")

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

if(data?.nascimento){
  const [ano, mes, dia] = data.nascimento.split("-")
  setNascimento(`${dia}/${mes}/${ano}`)
}

}

buscarCliente()

}, [telefone])


/* ================= VALIDAÇÕES ================= */

function handleTelefone(e){
  let valor = e.target.value

  // remove tudo que não for número
  valor = valor.replace(/\D/g, "")

  // limita a 11 dígitos
  if(valor.length > 11) return

  setTelefone(valor)
}

function handleNome(e){
let valor = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "")
setNome(valor)
}

function handleNascimento(e){
  let valor = e.target.value.replace(/\D/g, "")

  if (valor.length > 8) return

  if (valor.length > 4) {
    valor = `${valor.slice(0,2)}/${valor.slice(2,4)}/${valor.slice(4)}`
  } else if (valor.length > 2) {
    valor = `${valor.slice(0,2)}/${valor.slice(2)}`
  }

  setNascimento(valor)
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
  
if (!telefone || telefone.length !== 11) {
  alert("Digite um telefone válido com DDD (11 dígitos)")
  return
}

try{

setSalvando(true)

let nascimentoFormatado = null

if (nascimento) {
  const numeros = nascimento.replace(/\D/g, "")

  if (numeros.length !== 8) {
    alert("Digite a data de nascimento no formato dd/mm/aaaa")
    setSalvando(false)
    return
  }

  const dia = numeros.slice(0, 2)
  const mes = numeros.slice(2, 4)
  const ano = numeros.slice(4, 8)

  nascimentoFormatado = `${ano}-${mes}-${dia}`
}

let cliente = null

const { data: clienteExistente } = await supabase
.from("clientes")
.select("*")
.eq("telefone", telefone)
.single()

if(clienteExistente){

  // atualiza nascimento se ele não tiver ainda
if(nascimentoFormatado){
  await supabase
    .from("clientes")
    .update({ nascimento: nascimentoFormatado })
    .eq("id", clienteExistente.id)
}

  cliente = clienteExistente

}else{

const { data: novoCliente, error } = await supabase
.from("clientes")
.insert([{ nome, telefone, nascimento: nascimentoFormatado || null }])
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

setTimeout(async () => {
  try {
    await vincularClienteOneSignal(`cliente-${cliente.id}`)
    await pedirPermissaoPush()
  } catch (e) {
    console.log("OneSignal ainda não autorizado ou indisponível:", e)
  }
}, 300)


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
  inputMode="numeric"
  pattern="[0-9]*"
  autoComplete="tel"
  placeholder="DDD + número (67999999999)"
  value={telefone}
  onChange={handleTelefone}
  maxLength={11}
  className="w-full p-4 mb-4 bg-zinc-900 rounded-xl"
/>


{/* NOME */}

<input
placeholder="Nome completo"
value={nome}
onChange={handleNome}
className="w-full p-4 mb-4 bg-zinc-900 rounded-xl"
/>

{/* Data aniversário */}

<div className="w-full flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 gap-2 mb-4">
  Nascimento :

  <input
    type="text"
    inputMode="numeric"
    placeholder="dd/mm/aaaa"
    value={nascimento}
    onChange={handleNascimento}
    maxLength={10}
    className="bg-transparent outline-none text-white flex-1"
  />
</div>


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
disabled={salvando}
className={`flex-1 py-2 rounded ${
  salvando
    ? "bg-yellow-700 text-black opacity-70 cursor-not-allowed"
    : "bg-yellow-500 text-black"
}`}
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