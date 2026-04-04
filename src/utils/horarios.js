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

function intervaloConflita(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && fimA > inicioB
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

export async function obterHorariosDisponiveisEdicao({
  data,
  duracaoServico,
  agendamentoIgnorarId = null
}) {
  if (!data || !duracaoServico) return []

  const diaSemana = criarDataLocal(data).getDay()

  const { data: config, error: erroConfig } = await supabase
    .from("horarios_funcionamento")
    .select("*")
    .eq("dia_semana", diaSemana)
    .limit(1)
    .single()

  if (erroConfig || !config || !config.ativo) {
    return []
  }

  const { data: agendamentosDia, error: erroAgendamentos } = await supabase
    .from("agendamentos")
    .select(`
      id,
      horario,
      status,
      duracao_personalizada,
      servicos(duracao)
    `)
    .eq("data", data)
    .neq("status", "cancelado")

  if (erroAgendamentos) {
    console.log("Erro ao buscar agendamentos da edição:", erroAgendamentos)
    return []
  }

  const { data: bloqueiosHorarios, error: erroBloqueios } = await supabase
    .from("bloqueios_horarios")
    .select("horario")
    .eq("data", data)

  if (erroBloqueios) {
    console.log("Erro ao buscar bloqueios da edição:", erroBloqueios)
    return []
  }

  const inicioExpediente = horaParaMinutos(config.hora_inicio)
  const fimExpediente = horaParaMinutos(config.hora_fim)

  const agendamentosConvertidos = (agendamentosDia || [])
    .filter((item) => item.id !== agendamentoIgnorarId)
    .map((item) => {
      const inicio = horaParaMinutos(item.horario)
      const duracao = Number(
        item.duracao_personalizada || item.servicos?.duracao || 0
      )

      return {
        inicio,
        fim: inicio + duracao
      }
    })

  const bloqueiosConvertidos = (bloqueiosHorarios || []).map((item) => {
    const inicio = horaParaMinutos(item.horario)
    return {
      inicio,
      fim: inicio + 1
    }
  })

  const indisponiveis = [...agendamentosConvertidos, ...bloqueiosConvertidos]

  const horarios = []

  for (let cursor = inicioExpediente; cursor + duracaoServico <= fimExpediente; cursor += 5) {
    const fimCandidato = cursor + duracaoServico

    const temConflito = indisponiveis.some((item) =>
      intervaloConflita(cursor, fimCandidato, item.inicio, item.fim)
    )

    if (!temConflito) {
      horarios.push(minutosParaHora(cursor))
    }
  }

  return horarios
}