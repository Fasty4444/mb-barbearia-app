import { motion } from "framer-motion"
import { Scissors } from "lucide-react"
import { useNavigate } from "react-router-dom"
import PageTransition from "../components/PageTransition"
import CountUp from "react-countup"
import { useState, useEffect } from "react"
import AvisoPush from "../components/AvisoPush"
import { supabase } from "../lib/supabase"

export default function Home(){

const navigate = useNavigate()

const [menuAberto, setMenuAberto] = useState(false)
const [fotosGaleria, setFotosGaleria] = useState([])
const [fotoAtual, setFotoAtual] = useState(0)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

useEffect(() => {
  buscarGaleria()
}, [])

async function buscarGaleria() {
  const { data, error } = await supabase
    .from("galeria_home")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.log("Erro ao buscar galeria:", error)
    return
  }

  setFotosGaleria(data || [])
}

useEffect(() => {
  if (fotosGaleria.length <= 1) return

  const interval = setInterval(() => {
    setFotoAtual((prev) => (prev + 1) % fotosGaleria.length)
  }, 3000)

  return () => clearInterval(interval)
}, [fotosGaleria])

return(

<PageTransition>

<div className="min-h-screen bg-black text-white">

  {menuAberto && (
  <div className="fixed inset-0 z-[999]">

    {/* BACKDROP */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setMenuAberto(false)}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />

    {/* SIDEBAR */}
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="relative w-72 h-full bg-gradient-to-b from-zinc-900 to-black border-r border-white/10 shadow-2xl p-6 flex flex-col"
    >

      {/* TOPO */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-xl font-semibold tracking-wide text-white">
          Menu
        </h2>

        <button
          onClick={() => setMenuAberto(false)}
          className="text-zinc-400 hover:text-white transition text-xl"
        >
          ✕
        </button>
      </div>

      {/* ITENS */}
      <div className="flex flex-col gap-4 text-base">

        <button
          onClick={()=>{
            setMenuAberto(false)
            navigate("/agendamento")
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 transition shadow-sm"
        >
          📅 Agendar horário
        </button>
{/* 
        <button
          onClick={()=>{
            setMenuAberto(false)
            navigate("/cancelarCliente")
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition shadow-sm"
        >
          ❌ Cancelar agendamento
        </button>
*/}
<button
  onClick={()=>{
    setMenuAberto(false)
    navigate("/historico")
  }}
  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 transition shadow-sm w-full"
>
  🕘 Meu histórico
</button>

<button
  onClick={()=>{
    setMenuAberto(false)
    navigate("/perfil")
  }}
  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 transition shadow-sm w-full"
>
  👤 Meu perfil
</button>

<button
  onClick={()=>{
    setMenuAberto(false)
    navigate("/login-admin")
  }}
  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 transition shadow-sm w-full"
>
  🔐 Área do barbeiro
</button>


      </div>

{/* FOOTER */}
<div className="mt-auto pt-10 flex flex-col gap-4">

  <a
    href="https://wa.me/5567996609283?text=Olá,%20quero%20agendar%20um%20horário"
    target="_blank"
    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black font-medium py-3 rounded-xl transition shadow-lg"
  >
    💬 Falar no WhatsApp
  </a>

  <p className="text-xs text-zinc-500 text-center">
    MB PRIME ©
  </p>

</div>

    </motion.div>

  </div>
)}


{/* NAVBAR */}

<nav className="flex justify-between items-center px-8 py-6 border-b border-white/10 backdrop-blur-lg bg-black/30 sticky top-0 z-50">

<div className="flex items-center gap-4">

<button
onClick={()=>setMenuAberto(true)}
className="text-white text-2xl"
>
☰
</button>

<h1 className="text-1xl font-bold tracking-wide">
<span className="text-yellow-500">MB</span> Prime - Barbearia
</h1>

</div>

<motion.button
onClick={()=>navigate("/agendamento")}
whileHover={{scale:1.05}}
whileTap={{scale:0.95}}
className="bg-yellow-500 text-black px-6 py-2 rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition"
>
Agendar horário
</motion.button>

</nav>

{!isIOS && <AvisoPush />}

{/* HERO */}


<section className="relative flex flex-col items-center justify-center text-center mt-32 px-6 overflow-hidden">

{/* GLOW */}

<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
transition={{duration:2}}
className="absolute w-[500px] h-[500px] bg-yellow-500/20 blur-[120px] rounded-full top-[-100px] z-0"
/>

{/* TÍTULO */}

<motion.h2
initial={{opacity:0,y:60}}
animate={{opacity:1,y:0}}
transition={{duration:0.8}}
className="relative z-10 text-6xl md:text-7xl font-bold mb-6 leading-tight"
>

Qualidade
<br/>
e
<br/>
<span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient">
  Excelência.
</span>

</motion.h2>


{/* TEXTO */}

<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
transition={{delay:0.4}}
className="relative z-10 text-zinc-400 max-w-xl mb-10 text-lg"
>

Agende seu horário online e tenha uma experiência premium
na MB PRIME.

</motion.p>


{/* BOTÃO */}

<motion.button
onClick={()=>navigate("/agendamento")}
whileHover={{scale:1.07}}
whileTap={{scale:0.95}}
className="relative z-10 bg-yellow-500 text-black px-10 py-4 rounded-2xl text-lg hover:bg-yellow-400 transition shadow-xl shadow-yellow-500/30"
>

Agendar agora

</motion.button>
{/* 
<motion.button
onClick={()=>navigate("/cancelarCliente")}
whileHover={{scale:1.05}}
whileTap={{scale:0.95}}
className="mt-4 border border-yellow-500 text-yellow-500 px-10 py-4 rounded-2xl text-lg hover:bg-yellow-500 hover:text-black transition"
>
Cancelar agendamento
</motion.button>
*/}
{/* CONTADORES */}

<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
transition={{delay:1}}
className="relative z-10 mt-24 flex gap-16 text-center"
>

<div>
<p className="text-2xl font-bold text-yellow-500">
<CountUp end={15687} duration={2}/>
</p>
<p className="text-zinc-400">Cortes realizados</p>
</div>

<div>
<p className="text-2xl font-bold text-yellow-500">
<CountUp end={1200} duration={2}/>
</p>
<p className="text-zinc-400">Clientes atendidos</p>
</div>

<div>
<p className="text-2xl font-bold text-yellow-500">
4.9★
</p>
<p className="text-zinc-400">Avaliação</p>
</div>

</motion.div>

</section>


{/* GALERIA */}

<motion.section
  initial={{opacity:0,y:60}}
  whileInView={{opacity:1,y:0}}
  transition={{duration:0.6}}
  viewport={{once:true}}
  className="py-28 px-6"
>
  <h2 className="text-3xl font-bold text-center mb-12">
    Cortes realizados
  </h2>

  <div className="max-w-3xl mx-auto">
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {fotosGaleria.length > 0 ? (
        <>
          <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
            <img
              src={fotosGaleria[fotoAtual]?.imagem_url}
              alt={fotosGaleria[fotoAtual]?.legenda || "Corte realizado"}
              className="w-full h-full object-cover transition duration-700"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {fotosGaleria[fotoAtual]?.legenda && (
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white text-lg md:text-xl font-semibold">
                  {fotosGaleria[fotoAtual].legenda}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-4 bg-zinc-950">
            <button
              onClick={() =>
                setFotoAtual((prev) =>
                  prev === 0 ? fotosGaleria.length - 1 : prev - 1
                )
              }
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition"
            >
              ←
            </button>

            <div className="flex gap-2">
              {fotosGaleria.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFotoAtual(index)}
                  className={`w-3 h-3 rounded-full transition ${
                    index === fotoAtual ? "bg-yellow-500" : "bg-zinc-600"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setFotoAtual((prev) => (prev + 1) % fotosGaleria.length)
              }
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition"
            >
              →
            </button>
          </div>
        </>
      ) : (
        <div className="h-[320px] md:h-[420px] flex items-center justify-center text-zinc-500">
          Nenhuma foto cadastrada ainda.
        </div>
      )}
    </div>

    <div className="flex justify-center mt-6">
      <a
        href="https://www.instagram.com/mbprime_barbearia01/"
        target="_blank"
        rel="noreferrer"
        className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition"
      >
        Ver mais no Instagram
      </a>
    </div>
  </div>
</motion.section>


{/* SERVIÇOS */}

<motion.section
initial={{opacity:0,y:60}}
whileInView={{opacity:1,y:0}}
transition={{duration:0.6}}
viewport={{once:true}}
className="px-8"
>

<h3 className="text-3xl font-bold text-center mb-16">
Nossos Serviços
</h3>

<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

<motion.div whileHover={{y:-8}} className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 hover:border-yellow-500 transition">
<Scissors size={40} className="text-yellow-500 mb-4"/>
<h4 className="text-xl font-bold mb-2">Corte de cabelo</h4>
<p className="text-zinc-400">Cortes modernos com precisão profissional.</p>
</motion.div>

<motion.div whileHover={{y:-8}} className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 hover:border-yellow-500 transition">
<Scissors size={40} className="text-yellow-500 mb-4"/>
<h4 className="text-xl font-bold mb-2">Barba</h4>
<p className="text-zinc-400">Modelagem e acabamento profissional da barba.</p>
</motion.div>

<motion.div whileHover={{y:-8}} className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 hover:border-yellow-500 transition">
<Scissors size={40} className="text-yellow-500 mb-4"/>
<h4 className="text-xl font-bold mb-2">Corte + Barba</h4>
<p className="text-zinc-400">Experiência completa de estilo e cuidado.</p>
</motion.div>

</div>

</motion.section>


{/* BARBEIRO */}

<motion.section
initial={{opacity:0,y:60}}
whileInView={{opacity:1,y:0}}
transition={{duration:0.6}}
viewport={{once:true}}
className="py-28"
>

<h2 className="text-3xl font-bold text-center mb-12">
Nosso Barbeiro
</h2>

<div className="flex justify-center">

<motion.div whileHover={{scale:1.05}} className="bg-zinc-900 rounded-xl p-8 text-center max-w-sm border border-zinc-800">

<img src="/img/matheus.jpg" className="w-32 h-32 rounded-full object-cover mx-auto mb-6"/>

<h3 className="text-xl font-bold">Matheus</h3>

<p className="text-zinc-400 mt-2">
Especialista em cortes modernos e barba.
</p>

</motion.div>

</div>

</motion.section>


{/* MAPA */}

<motion.section
initial={{opacity:0,y:60}}
whileInView={{opacity:1,y:0}}
transition={{duration:0.6}}
viewport={{once:true}}
className="py-20"
>

<h2 className="text-3xl font-bold text-center mb-12">
Onde estamos
</h2>

<div className="max-w-5xl mx-auto">

<iframe
className="w-full h-[400px] rounded-xl"
src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1312.2112060656948!2d-54.43849334307844!3d-22.409509536476943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94896b2fd6d1c401%3A0x1f55229866c42dda!2sMB%20PRIME%20BARBEARIA!5e1!3m2!1spt-BR!2sbr!4v1773364448204!5m2!1spt-BR!2sbr"
loading="lazy"
/>

</div>

</motion.section>

</div>

<section className="py-20 border-t border-white/10 mt-20">

  <h2 className="text-2xl font-bold text-center mb-10">
    Contato
  </h2>

  <div className="flex flex-col md:flex-row justify-center items-center gap-10">

    {/* DONO */}
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center w-[280px] hover:border-yellow-500 transition">

      <h3 className="text-lg font-bold mb-2">
        Matheus Mello
      </h3>

      <p className="text-zinc-400 mb-4">
        Proprietário
      </p>

      <a
        href="https://wa.me/5567996609283"
        target="_blank"
        className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
      >
        Falar no WhatsApp
      </a>

    </div>

    {/* DEV */}
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center w-[280px] hover:border-yellow-500 transition">

      <h3 className="text-lg font-bold mb-2">
        Felipe Vasconcelos
      </h3>

      <p className="text-zinc-400 mb-4">
        Desenvolvedor
      </p>

      <a
        href="https://wa.me/5567998649553"
        target="_blank"
        className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
      >
        Falar no WhatsApp
      </a>


    </div>

  </div>

</section>

</PageTransition>

)

}