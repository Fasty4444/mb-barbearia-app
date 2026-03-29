import { useState } from "react"

export default function AbrirCaixaModal({ aberto, onClose, onConfirm }) {
  const [valorInicial, setValorInicial] = useState("")
  const [observacao, setObservacao] = useState("")

  if (!aberto) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Abrir caixa</h2>

        <input
          type="number"
          step="0.01"
          placeholder="Valor inicial"
          value={valorInicial}
          onChange={(e) => setValorInicial(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700"
        />

        <textarea
          placeholder="Observação de abertura (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="w-full p-3 mb-4 bg-zinc-800 rounded-xl border border-zinc-700 min-h-[100px]"
        />

        <div className="flex gap-2">
          <button
            onClick={() =>
              onConfirm({
                valorInicial,
                observacao
              })
            }
            className="bg-green-500 text-black px-4 py-2 rounded-xl font-semibold"
          >
            Confirmar abertura
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