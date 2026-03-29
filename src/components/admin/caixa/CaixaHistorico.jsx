import { formatarDataHora, formatarMoeda } from "../../../utils/caixa"

export default function CaixaHistorico({ caixasFechados, onAbrirHistorico }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h2 className="text-xl font-bold mb-4">Histórico de caixas fechados</h2>

      {caixasFechados.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-400">
          Nenhum caixa fechado encontrado.
        </div>
      ) : (
        <div className="grid gap-3">
          {caixasFechados.map((caixa) => (
<button
  key={caixa.id}
  onClick={() => onAbrirHistorico(caixa)}
  className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-yellow-500 transition"
>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-bold text-white">
                    Caixa fechado
                  </p>

                  <p className="text-sm text-zinc-400">
                    Aberto em: {formatarDataHora(caixa.aberto_em)}
                  </p>

                  <p className="text-sm text-zinc-400">
                    Fechado em: {formatarDataHora(caixa.fechado_em)}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-yellow-500 font-bold">
                    Inicial: {formatarMoeda(caixa.valor_inicial)}
                  </p>

                  <p className="text-sm text-zinc-400">
                    Final informado: {formatarMoeda(caixa.valor_final_informado)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}