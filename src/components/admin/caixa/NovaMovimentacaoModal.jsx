import { useEffect, useState } from "react"

export default function NovaMovimentacaoModal({
  aberto,
  onClose,
  onConfirm,
  tipoInicial = "saida"
}) {
  const [tipo, setTipo] = useState(tipoInicial)
  const [valor, setValor] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [descricao, setDescricao] = useState("")

  useEffect(() => {
    if (!aberto) return
    setTipo(tipoInicial)
    setValor("")
    setFormaPagamento("dinheiro")
    setDescricao("")
  }, [aberto, tipoInicial])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Nova movimentação</h2>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700"
        >
          <option value="saida">Saída</option>
          <option value="sangria">Sangria</option>
          <option value="ajuste">Ajuste</option>
          <option value="entrada">Entrada manual</option>
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
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
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700 min-h-[100px]"
        />

        <div className="flex gap-2">
          <button
            onClick={() =>
              onConfirm({
                tipo,
                valor,
                formaPagamento,
                descricao
              })
            }
            className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-semibold"
          >
            Salvar movimentação
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