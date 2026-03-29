import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function ConfigPush() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [registroId, setRegistroId] = useState(null)
  const [titulo, setTitulo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    carregarConfig()
  }, [])

  async function carregarConfig() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("config_push")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        alert("Erro ao carregar configuração do push")
        return
      }

      if (data) {
        setRegistroId(data.id)
        setTitulo(data.titulo || "")
        setMensagem(data.mensagem || "")
        setAtivo(data.ativo)
      } else {
        const { data: primeiroRegistro, error: errorFallback } = await supabase
          .from("config_push")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (errorFallback) {
          alert("Erro ao carregar configuração do push")
          return
        }

        if (primeiroRegistro) {
          setRegistroId(primeiroRegistro.id)
          setTitulo(primeiroRegistro.titulo || "")
          setMensagem(primeiroRegistro.mensagem || "")
          setAtivo(primeiroRegistro.ativo)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function salvarConfig() {
    if (!titulo.trim() || !mensagem.trim()) {
      alert("Preencha o título e a mensagem do push.")
      return
    }

    try {
      setSalvando(true)

      const payload = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        ativo,
      }

      let error = null

      if (registroId) {
        const resposta = await supabase
          .from("config_push")
          .update(payload)
          .eq("id", registroId)

        error = resposta.error
      } else {
        const resposta = await supabase
          .from("config_push")
          .insert([payload])
          .select()
          .single()

        error = resposta.error

        if (resposta.data) {
          setRegistroId(resposta.data.id)
        }
      }

      if (error) {
        alert(error.message || "Erro ao salvar configuração.")
        return
      }

      alert("Configuração do push salva com sucesso!")
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Carregando configuração do push...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/admin")}
          className="text-zinc-400 mb-6"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold mb-2">Configuração do Push</h1>
        <p className="text-zinc-400 mb-8">
          Edite a mensagem padrão que será enviada ao cliente 2 horas antes do agendamento.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Título do push
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: MB Barbearia"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Mensagem do push
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={5}
              placeholder="Ex.: Olá! Seu horário é hoje às {{horario}}. Toque para confirmar ou cancelar sua presença."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Você poderá usar variáveis como {"{{horario}}"}, {"{{data}}"}, {"{{nome}}"} depois no envio automático.
            </p>
          </div>

          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4">
            <div>
              <p className="font-medium">Push ativo</p>
              <p className="text-sm text-zinc-500">
                Quando desligado, o sistema não enviará lembretes push.
              </p>
            </div>

            <button
              onClick={() => setAtivo(!ativo)}
              className={`px-4 py-2 rounded-xl ${
                ativo
                  ? "bg-green-500 text-black"
                  : "bg-zinc-700 text-white"
              }`}
            >
              {ativo ? "Ativo" : "Inativo"}
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-sm text-zinc-400 mb-2">Prévia</p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4">
              <p className="font-semibold">{titulo || "MB Barbearia"}</p>
              <p className="text-zinc-300 mt-1">
                {mensagem || "Sua mensagem aparecerá aqui."}
              </p>
            </div>
          </div>

          <button
            onClick={salvarConfig}
            disabled={salvando}
            className={`w-full py-3 rounded-xl font-medium ${
              salvando
                ? "bg-yellow-700 text-black opacity-70 cursor-not-allowed"
                : "bg-yellow-500 text-black"
            }`}
          >
            {salvando ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </div>
    </div>
  )
}