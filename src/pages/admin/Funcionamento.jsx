import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"

const diasSemana = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
]

export default function Funcionamento(){

  const navigate = useNavigate()
  const [horarios, setHorarios] = useState([])

  async function carregar(){

    const { data } = await supabase
      .from("horarios_funcionamento")
      .select("*")

    if(data && data.length > 0){
      setHorarios(data)
    }else{
      // cria padrão vazio
const padrao = diasSemana.map((_, i)=>({
  dia_semana: i,
  ativo: false,
  hora_inicio: "08:00",
  hora_fim: "18:00",
  intervalo: 30
}))
      setHorarios(padrao)
    }
  }

  useEffect(()=>{
    carregar()
  }, [])

  function atualizar(index, campo, valor){
    const copia = [...horarios]
    copia[index][campo] = valor
    setHorarios(copia)
  }

async function salvar(){

  console.log("SALVANDO:", horarios)

  // limpa tudo corretamente
  const { error: erroDelete } = await supabase
    .from("horarios_funcionamento")
    .delete()
    .not("id", "is", null)

  if(erroDelete){
    console.log("ERRO DELETE:", erroDelete)
    alert("Erro ao limpar dados")
    return
  }

  // insere novamente
  const { error: erroInsert } = await supabase
  .from("horarios_funcionamento")
  .insert(
    horarios.map(h => ({
      dia_semana: h.dia_semana,
      ativo: h.ativo,
      hora_inicio: h.hora_inicio,
      hora_fim: h.hora_fim,
      intervalo: Number(h.intervalo)
    }))
  )

  if(erroInsert){
    console.log("ERRO INSERT:", erroInsert)
    alert("Erro ao salvar")
    return
  }

  alert("Salvo com sucesso!")
}

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">

      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={()=>navigate("/admin")}
            className="text-zinc-400"
          >
            ← Voltar
          </button>

          <h1 className="text-2xl font-bold">
            Horário de funcionamento
          </h1>

          <div />
        </div>

        {/* LISTA */}
        <div className="space-y-4">

          {horarios.map((dia, index)=>(
            <div
              key={index}
              className="bg-zinc-900 p-4 rounded-xl border border-zinc-800"
            >

              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">
                  {diasSemana[dia.dia_semana]}
                </p>

                <input
                  type="checkbox"
                  checked={dia.ativo}
                  onChange={(e)=>atualizar(index, "ativo", e.target.checked)}
                />
              </div>

              {dia.ativo && (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="time"
                      value={dia.hora_inicio}
                      onChange={(e)=>atualizar(index, "hora_inicio", e.target.value)}
                      className="w-full p-2 bg-zinc-800 rounded"
                    />

                    <input
                      type="time"
                      value={dia.hora_fim}
                      onChange={(e)=>atualizar(index, "hora_fim", e.target.value)}
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                  </div>

                  <input
                    type="number"
                    value={dia.intervalo}
                    onChange={(e)=>atualizar(index, "intervalo", e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                    placeholder="Intervalo (min)"
                  />
                </>
              )}

            </div>
          ))}

        </div>

        {/* BOTÃO */}
        <button
          onClick={salvar}
          className="bg-green-500 text-black font-bold w-full py-3 rounded-xl mt-6"
        >
          Salvar horários
        </button>

      </div>

    </div>
  )
}