import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { DateTime } from "https://esm.sh/luxon@3.5.0"

const TIMEZONE = "America/Campo_Grande"

type ConfigPush = {
  id: string
  titulo: string
  mensagem: string
  ativo: boolean
}

type Agendamento = {
  id: string
  data: string
  horario: string
  cliente_id: string
  lembrete_enviado?: boolean | null
  push_lembrete_enviado: boolean
  push_lembrete_enviado_em: string | null
  push_status: string | null
  push_erro: string | null
  clientes?: { nome?: string | null; telefone?: string | null } | null
  servicos?: { nome?: string | null; preco?: number | null } | null
  barbeiros?: { nome?: string | null } | null
}

function montarMensagem(template: string, agendamento: Agendamento) {
  return template
    .replaceAll("{{nome}}", agendamento.clientes?.nome || "cliente")
    .replaceAll("{{horario}}", agendamento.horario || "")
    .replaceAll("{{data}}", agendamento.data || "")
    .replaceAll("{{servico}}", agendamento.servicos?.nome || "")
    .replaceAll("{{barbeiro}}", agendamento.barbeiros?.nome || "")
}

function parseDataHoraLocal(data: string, horario: string) {
  return DateTime.fromISO(`${data}T${horario}:00`, { zone: TIMEZONE })
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")!
    const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!
    const appBaseUrl = Deno.env.get("APP_BASE_URL")!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const agora = DateTime.now().setZone(TIMEZONE)
    const janelaInicio = agora.plus({ hours: 2 })
    const janelaFim = janelaInicio.plus({ minutes: 5 })

    const dataMin = janelaInicio.toFormat("yyyy-MM-dd")
    const dataMax = janelaFim.toFormat("yyyy-MM-dd")

    const { data: configPush, error: configError } = await supabase
      .from("config_push")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<ConfigPush>()

    if (configError) throw configError

    if (!configPush) {
      return new Response(
        JSON.stringify({ ok: true, message: "Push inativo ou sem configuração." }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

const { data: agendamentos, error: agError } = await supabase
  .from("agendamentos")
  .select(`
    id,
    data,
    horario,
    cliente_id,
    lembrete_enviado,
    push_lembrete_enviado,
    push_lembrete_enviado_em,
    push_status,
    push_erro,
    clientes(nome, telefone),
    servicos(nome, preco),
    barbeiros(nome)
  `)
  .eq("push_lembrete_enviado", false)
  .gte("data", dataMin)
  .lte("data", dataMax)

    if (agError) throw agError

    const candidatos = (agendamentos || []).filter((ag: Agendamento) => {
      if (ag.lembrete_enviado) return false
      const dataHora = parseDataHoraLocal(ag.data, ag.horario)
      return dataHora >= janelaInicio && dataHora < janelaFim
    })

    const resultados: Array<{ id: string; status: string; detalhe?: string }> = []

    for (const agendamento of candidatos) {
      try {
            if (agendamento.lembrete_enviado) {
      await supabase
        .from("agendamentos")
        .update({
          push_status: "ignorado_whatsapp",
          push_erro: null,
        })
        .eq("id", agendamento.id)

      resultados.push({
        id: agendamento.id,
        status: "ignorado_whatsapp",
      })

      continue
    }
        const titulo = montarMensagem(configPush.titulo, agendamento)
        const mensagem = montarMensagem(configPush.mensagem, agendamento)

        const respostaUrl = `${appBaseUrl}/responder-lembrete?id=${agendamento.id}`
        const confirmUrl = `${appBaseUrl}/confirmar?id=${agendamento.id}`
        const cancelUrl = `${appBaseUrl}/cancelar?id=${agendamento.id}`

        const externalId = `cliente-${agendamento.cliente_id}`

        const resp = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key ${oneSignalRestApiKey}`,
          },
          body: JSON.stringify({
            app_id: oneSignalAppId,
            include_aliases: {
              external_id: [externalId],
            },
            target_channel: "push",
            headings: { en: titulo, pt: titulo },
            contents: { en: mensagem, pt: mensagem },
            web_url: respostaUrl,
            web_buttons: [
              {
                id: "confirmar",
                text: "Confirmar",
                url: confirmUrl,
              },
              {
                id: "cancelar",
                text: "Cancelar",
                url: cancelUrl,
              },
            ],
          }),
        })

        const json = await resp.json()

        if (!resp.ok) {
          await supabase
            .from("agendamentos")
            .update({
              push_status: "erro",
              push_erro: JSON.stringify(json),
            })
            .eq("id", agendamento.id)

          resultados.push({
            id: agendamento.id,
            status: "erro",
            detalhe: JSON.stringify(json),
          })
          continue
        }

        await supabase
          .from("agendamentos")
          .update({
            push_lembrete_enviado: true,
            push_lembrete_enviado_em: DateTime.now().setZone(TIMEZONE).toISO(),
            push_status: "enviado",
            push_erro: null,
          })
          .eq("id", agendamento.id)

        resultados.push({
          id: agendamento.id,
          status: "enviado",
        })
      } catch (err) {
        await supabase
          .from("agendamentos")
          .update({
            push_status: "erro",
            push_erro: String(err),
          })
          .eq("id", agendamento.id)

        resultados.push({
          id: agendamento.id,
          status: "erro",
          detalhe: String(err),
        })
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_encontrados: candidatos.length,
        resultados,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})