import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"

export default function Agendamento() {
  const navigate = useNavigate()
  const barbeirosRef = useRef(null)

  const [servicos, setServicos] = useState([])
  const [barbeiros, setBarbeiros] = useState([])

  const [servicoSelecionado, setServicoSelecionado] = useState(null)
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null)

  function scrollSuave(element) {
    const target = element.getBoundingClientRect().top + window.scrollY - 80
    const start = window.scrollY
    const distance = target - start
    const duration = 600

    let startTime = null

    function animation(currentTime) {
      if (!startTime) startTime = currentTime
      const timeElapsed = currentTime - startTime

      const progress = Math.min(timeElapsed / duration, 1)

      window.scrollTo(0, start + distance * easeInOut(progress))

      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }

    function easeInOut(t) {
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    requestAnimationFrame(animation)
  }

  useEffect(() => {
    async function carregarServicos(){
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .eq("visivel_cliente", true)
        .order("preco")

      if(error){
        console.log(error)
        return
      }

      setServicos(data)
    }

    carregarServicos()
  }, [])

  useEffect(() => {
    async function carregarBarbeiros(){
      const { data, error } = await supabase
        .from("barbeiros")
        .select("*")
        .eq("ativo", true)

      if(error){
        console.log(error)
        return
      }

      setBarbeiros(data)
    }

    carregarBarbeiros()
  }, [])

  function formatarDuracao(minutos){
    if(minutos < 60){
      return `${minutos} minutos`
    }

    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60

    if(mins === 0){
      return `${horas} hora`
    }

    return `${horas}h ${mins}min`
  }

  function temPromocao(servico) {
    const preco = Number(servico?.preco || 0)
    const promocional = Number(servico?.preco_promocional || 0)

    return promocional > 0 && promocional < preco
  }

  function calcularDescontoPercentual(servico) {
    const preco = Number(servico?.preco || 0)
    const promocional = Number(servico?.preco_promocional || 0)

    if (!preco || !promocional || promocional >= preco) return 0

    return Math.round(((preco - promocional) / preco) * 100)
  }

  function selecionarServico(servico){
    const barbeiroFixo = {
      id: "abe98043-5925-4ad7-bb09-41f50c12f71f",
      nome: "Matheus"
    }

    setServicoSelecionado(servico)
    setBarbeiroSelecionado(barbeiroFixo)

    navigate("/data", {
      state: {
        servico,
        barbeiro: barbeiroFixo
      }
    })
  }

  function selecionarBarbeiro(barbeiro){
    if(!servicoSelecionado){
      alert("Escolha um serviço primeiro")
      return
    }

    setBarbeiroSelecionado(barbeiro)

    navigate("/data", {
      state:{
        servico: servicoSelecionado,
        barbeiro
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="max-w-xl w-full p-6 md:p-8">
        <button
          onClick={()=>navigate("/")}
          className="text-zinc-400 hover:text-white mb-4"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold mb-6 text-center">
          Agendar horário
        </h1>

        <div className="flex justify-between mb-8 text-sm text-zinc-500">
          <span className="text-yellow-500 font-semibold">1. Serviço</span>
          <span>2. Horário</span>
          <span>3. Dados</span>
        </div>

        {servicoSelecionado && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 text-center">
            <p className="text-zinc-400 text-sm">Selecionado</p>
            <p className="font-bold text-lg">
              {servicoSelecionado.nome}
              {barbeiroSelecionado && ` • ${barbeiroSelecionado.nome}`}
            </p>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">
          Escolha o serviço
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map((servico, index)=>(
            <motion.div
              key={servico.id}
              initial={{opacity:0, y:40}}
              animate={{opacity:1, y:0}}
              transition={{delay:index * 0.05}}
              whileTap={{scale:0.95}}
              onClick={()=>selecionarServico(servico)}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-300
              ${servicoSelecionado?.id === servico.id
                ? "bg-yellow-500 text-black scale-105 shadow-lg shadow-yellow-500/30"
                : "bg-zinc-900 border border-zinc-800 hover:border-yellow-500 hover:scale-105"}`}
            >
              <p className="font-bold">
                {servico.nome}
              </p>

              {temPromocao(servico) ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500 line-through">
                    R$ {Number(servico.preco || 0).toFixed(2)}
                  </span>

                  <span className="text-base font-bold text-yellow-500">
                    R$ {Number(servico.preco_promocional || 0).toFixed(2)}
                  </span>

                  <span className="text-[11px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                    {calcularDescontoPercentual(servico)}% OFF
                  </span>
                </div>
              ) : (
                <p className="text-base font-bold text-yellow-500 mt-2">
                  R$ {Number(servico.preco || 0).toFixed(2)}
                </p>
              )}

              <p className="text-sm opacity-70 mt-1">
                ⏱ {formatarDuracao(servico.duracao)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* BARBEIROS */}
        {/*
        <div ref={barbeirosRef} className="mt-10">
          <h2 className="text-xl font-semibold mb-4">
            Escolha o barbeiro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbeiros.map((barbeiro, index)=>(
              <motion.div
                key={barbeiro.id}
                initial={{opacity:0, y:40}}
                whileInView={{opacity:1, y:0}}
                viewport={{once:true}}
                transition={{delay:index * 0.08}}
                whileTap={{scale:0.95}}
                onClick={()=>selecionarBarbeiro(barbeiro)}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-300
                ${barbeiroSelecionado?.id === barbeiro.id
                  ? "bg-yellow-500 text-black scale-105 shadow-lg shadow-yellow-500/30"
                  : "bg-zinc-900 border border-zinc-800 hover:border-yellow-500 hover:scale-105"}`}
              >
                <p className="font-bold">
                  {barbeiro.nome}
                </p>

                <p className="text-sm opacity-70">
                  {barbeiro.especialidade}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        */}
      </div>
    </div>
  )
}
