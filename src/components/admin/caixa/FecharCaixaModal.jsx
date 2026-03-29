import { useState } from "react"
import { formatarMoeda } from "../../../utils/caixa"

export default function FecharCaixaModal({ aberto, onClose, onConfirm, resumo }) {
  const [valorFinalInformado, setValorFinalInformado] = useState("")
  const [observacao, setObservacao] = useState("")

  if (!aberto) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Fechar caixa</h2>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 text-sm">
          <p className="text-zinc-400">Saldo calculado</p>
          <p className="text-yellow-500 font-bold text-xl">
            {formatarMoeda(resumo?.saldo || 0)}
          </p>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Valor final contado no caixa"
          value={valorFinalInformado}
          onChange={(e) => setValorFinalInformado(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700"
        />

        <textarea
          placeholder="Observação de fechamento (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700 min-h-[100px]"
        />

        <div className="flex gap-2">
          <button
            onClick={() =>
              onConfirm({
                valorFinalInformado,
                observacao
              })
            }
            className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
          >
            Confirmar fechamento
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