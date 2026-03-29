import { formatarMoeda } from "../../../utils/caixa"

function CardResumo({ titulo, valor, cor = "text-white" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-xs text-zinc-400">{titulo}</p>
      <p className={`text-xl font-bold ${cor}`}>{valor}</p>
    </div>
  )
}

export default function CaixaResumo({ caixa, resumo }) {
  if (!caixa) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      <CardResumo titulo="Status" valor="Aberto" cor="text-green-400" />
      <CardResumo titulo="Valor inicial" valor={formatarMoeda(caixa.valor_inicial)} cor="text-yellow-500" />
      <CardResumo titulo="Entradas" valor={formatarMoeda(resumo.entradas)} cor="text-green-400" />
      <CardResumo titulo="Saídas" valor={formatarMoeda(resumo.saidas)} cor="text-red-400" />
      <CardResumo titulo="Pix" valor={formatarMoeda(resumo.pix)} cor="text-cyan-400" />
      <CardResumo titulo="Dinheiro" valor={formatarMoeda(resumo.dinheiro)} cor="text-emerald-400" />
      <CardResumo titulo="Saldo" valor={formatarMoeda(resumo.saldo)} cor="text-yellow-500" />
    </div>
  )
}