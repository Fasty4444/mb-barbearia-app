import { useNavigate } from "react-router-dom"
import PageTransition from "../components/PageTransition"

export default function Barbeiro() {

  const navigate = useNavigate()

  const barbeiros = [
    {
      nome:"Matheus",
      especialidade:"Cortes modernos"
    },
    {
      nome:"João",
      especialidade:"Especialista em barba"
    },
    {
      nome:"Carlos",
      especialidade:"Estilo clássico"
    }
  ]

  return (

    <PageTransition>

      <div className="min-h-screen bg-black text-white p-8">

        <h2 className="text-4xl font-bold text-center mb-12">
          Escolha um barbeiro
        </h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">

          {barbeiros.map((barbeiro,index)=>(
            
            <div
              key={index}
              onClick={()=>navigate("/data")}
              className="bg-zinc-900 p-8 rounded-2xl border border-white/10 hover:border-yellow-500 hover:scale-105 transition cursor-pointer text-center"
            >

              <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-6"></div>

              <h3 className="text-xl font-bold">
                {barbeiro.nome}
              </h3>

              <p className="text-zinc-400 mt-2">
                {barbeiro.especialidade}
              </p>

            </div>

          ))}

        </div>

      </div>

    </PageTransition>
  )
}