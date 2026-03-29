import { formatarDataHora, formatarMoeda } from "../../../utils/caixa"

function corTipo(tipo) {
  if (tipo === "abertura") return "border-yellow-500"
  if (tipo === "entrada") return "border-green-500"
  if (tipo === "saida") return "border-red-500"
  if (tipo === "sangria") return "border-orange-500"
  if (tipo === "ajuste") return "border-blue-500"
  return "border-zinc-800"
}

function labelTipo(tipo) {
  if (tipo === "abertura") return "Abertura"
  if (tipo === "entrada") return "Entrada"
  if (tipo === "saida") return "Saída"
  if (tipo === "sangria") return "Sangria"
  if (tipo === "ajuste") return "Ajuste"
  return tipo
}

export default function CaixaMovimentacoes({ movimentacoes }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h2 className="text-xl font-bold mb-4">Movimentações do caixa aberto</h2>

      {movimentacoes.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-400">
          Nenhuma movimentação encontrada.
        </div>
      ) : (
        <div className="grid gap-3">
          {movimentacoes.map((mov) => (
            <div
              key={mov.id}
              className={`bg-zinc-950 border rounded-xl p-4 ${corTipo(mov.tipo)}`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-bold text-white">
                    {mov.descricao || labelTipo(mov.tipo)}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {labelTipo(mov.tipo)} • {mov.forma_pagamento || "Sem forma de pagamento"}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {formatarDataHora(mov.criado_em)}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-yellow-500 font-bold">
                    {formatarMoeda(mov.valor)}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {mov.origem || "manual"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}