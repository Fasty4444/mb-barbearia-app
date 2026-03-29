import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import { formatarMoeda } from "../../../utils/caixa"

export default function DarBaixaModal({
  aberto,
  onClose,
  onSuccess,
  agendamento
}) {
  const [valorRecebido, setValorRecebido] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("pix")
  const [observacao, setObservacao] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto || !agendamento) return

    setValorRecebido(
      agendamento.valor_pago ??
        agendamento.servicos?.preco ??
        ""
    )

    setFormaPagamento(
      agendamento.forma_pagamento || "pix"
    )

    setObservacao("")
  }, [aberto, agendamento])

  async function confirmarBaixa() {
    if (!agendamento) return

    if (agendamento.status_pagamento === "pago") {
      alert("Este agendamento já foi baixado no caixa.")
      return
    }

    const valor = Number(valorRecebido || 0)

    if (!valor || valor <= 0) {
      alert("Informe um valor válido.")
      return
    }

    setSalvando(true)

    const { data: caixaAberto, error: erroCaixa } = await supabase
      .from("caixas")
      .select("*")
      .eq("status", "aberto")
      .order("aberto_em", { ascending: false })
      .limit(1)

    if (erroCaixa) {
      console.log(erroCaixa)
      alert("Erro ao buscar caixa aberto.")
      setSalvando(false)
      return
    }

    const caixa = caixaAberto?.[0]

    if (!caixa) {
      alert("Abra um caixa antes de registrar pagamento.")
      setSalvando(false)
      return
    }

    const descricao = `Pagamento - ${agendamento.clientes?.nome || "Cliente"} - ${agendamento.servicos?.nome || "Serviço"}`

    const { error: erroMov } = await supabase
      .from("movimentacoes_caixa")
      .insert({
        caixa_id: caixa.id,
        agendamento_id: agendamento.id,
        barbeiro_id: agendamento.barbeiro_id || null,
        tipo: "entrada",
        origem: "agendamento",
        descricao,
        valor,
        forma_pagamento: formaPagamento
      })

    if (erroMov) {
      console.log(erroMov)
      alert("Erro ao registrar movimentação no caixa.")
      setSalvando(false)
      return
    }

    const { error: erroAg } = await supabase
      .from("agendamentos")
      .update({
        status_pagamento: "pago",
        valor_pago: valor,
        forma_pagamento: formaPagamento,
        caixa_id: caixa.id,
        pago_em: new Date().toISOString()
      })
      .eq("id", agendamento.id)

    if (erroAg) {
      console.log(erroAg)
      alert("Erro ao atualizar o agendamento.")
      setSalvando(false)
      return
    }

    setSalvando(false)
    onClose()
    onSuccess?.()
  }

  if (!aberto || !agendamento) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Dar baixa no agendamento</h2>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
          <p className="font-bold text-white">
            {agendamento.clientes?.nome || "Cliente"}
          </p>

          <p className="text-sm text-zinc-400">
            {agendamento.servicos?.nome || "Serviço"}
          </p>

          <p className="text-sm text-zinc-400">
            Valor sugerido: {formatarMoeda(agendamento.servicos?.preco || 0)}
          </p>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Valor recebido"
          value={valorRecebido}
          onChange={(e) => setValorRecebido(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700"
        />

        <select
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700"
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">Pix</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="outro">Outro</option>
        </select>

        <textarea
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700 min-h-[90px]"
        />

        <div className="flex gap-2">
          <button
            onClick={confirmarBaixa}
            disabled={salvando}
            className="bg-green-500 text-black px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Confirmar baixa"}
          </button>

          <button
            onClick={onClose}
            className="bg-zinc-700 px-4 py-2 rounded-xl"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}