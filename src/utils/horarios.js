import { supabase } from "../lib/supabase"

// converte "08:30" → minutos
function horaParaMinutos(hora){
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

// converte minutos → "08:30"
function minutosParaHora(min){
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
}

export async function obterHorariosPorData(data){

  const dataObj = new Date(data + "T12:00:00")
  const diaSemana = dataObj.getDay()

  const { data: config } = await supabase
    .from("horarios_funcionamento")
    .select("*")
    .eq("dia_semana", diaSemana)
    .single()

  if(!config || !config.ativo){
    return []
  }

  const inicio = horaParaMinutos(config.hora_inicio)
  const fim = horaParaMinutos(config.hora_fim)
  const intervalo = config.intervalo

  const horarios = []

  for(let t = inicio; t < fim; t += intervalo){
    horarios.push(minutosParaHora(t))
  }

  return horarios
}