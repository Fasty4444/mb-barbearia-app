import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Sucesso(){

const navigate = useNavigate()
const location = useLocation()

const { nome, servico, barbeiro, data, horario } = location.state || {}

return (

<div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

<motion.div
initial={{opacity:0, scale:0.8}}
animate={{opacity:1, scale:1}}
className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center max-w-md w-full"
>

{/* ÍCONE */}
<motion.div
initial={{scale:0}}
animate={{scale:1}}
transition={{delay:0.2}}
className="flex justify-center mb-6"
>
<CheckCircle size={80} className="text-green-500"/>
</motion.div>

{/* TÍTULO */}
<h1 className="text-2xl font-bold mb-2">
Agendamento confirmado 🎉
</h1>

<p className="text-zinc-400 mb-6">
Seu horário foi reservado com sucesso
</p>

{/* RESUMO */}
<div className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-left mb-6">

<p><span className="text-zinc-400">Cliente:</span> {nome}</p>
<p><span className="text-zinc-400">Serviço:</span> {servico?.nome}</p>
<p><span className="text-zinc-400">Barbeiro:</span> {barbeiro?.nome}</p>
<p><span className="text-zinc-400">Data:</span> {data}</p>
<p><span className="text-zinc-400">Hora:</span> {horario}</p>

</div>

{/* BOTÕES */}
<div className="flex flex-col gap-3">

<button
onClick={()=>navigate("/")}
className="bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition"
>
Voltar para início
</button>

<button
onClick={()=>navigate("/agendamento")}
className="border border-zinc-700 py-3 rounded-xl hover:border-yellow-500 transition"
>
Novo agendamento
</button>

</div>

</motion.div>

</div>

)
}