import { useState, useEffect } from "react"

export default function AdminRoute({ children }) {

const [autorizado, setAutorizado] = useState(false)
const [pin, setPin] = useState("")

const PIN_CORRETO = import.meta.env.VITE_ADMIN_PIN

useEffect(() => {
const acesso = localStorage.getItem("admin_autorizado")
if(acesso === "true"){
setAutorizado(true)
}
}, [])

function validarPin(){

if(pin === PIN_CORRETO){
localStorage.setItem("admin_autorizado", "true")
setAutorizado(true)
}else{
alert("Senha incorreta")
}

}

if(!autorizado){
return (

<div className="min-h-screen bg-black flex items-center justify-center text-white">

<div className="bg-zinc-900 p-8 rounded-xl w-[300px] text-center">

<h2 className="text-xl mb-4">Acesso restrito</h2>

<input
type="password"
placeholder="Digite o PIN"
value={pin}
onChange={(e)=>setPin(e.target.value)}
className="w-full p-3 mb-4 bg-zinc-800 rounded"
/>

<button
onClick={validarPin}
className="w-full bg-yellow-500 text-black py-3 rounded"
>
Entrar
</button>

</div>

</div>

)
}

return children
}