import { supabase } from "../lib/supabase"

function criarDataLocal(dataString) {
  const [ano, mes, dia] = dataString.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function horaParaMinutos(hora) {
  const [h, m] = String(hora).slice(0, 5).split(":").map(Number)
  return h * 60 + m
}

function minutosParaHora(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export async function obterHorariosPorData(data) {
  const diaSemana = criarDataLocal(data).getDay()

  const { data: config, error } = await supabase
    .from("horarios_funcionamento")
    .select("*")
    .eq("dia_semana", diaSemana)
    .limit(1)
    .single()

  if (error || !config || !config.ativo) {
    return []
  }

  const inicio = horaParaMinutos(config.hora_inicio)
  const fim = horaParaMinutos(config.hora_fim)
  const intervalo = Number(config.intervalo || 35)

  const horarios = []

  for (let t = inicio; t + intervalo <= fim; t += intervalo) {
    horarios.push(minutosParaHora(t))
  }

  return horarios
}