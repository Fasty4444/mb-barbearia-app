import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import CaixaResumo from "../../components/admin/caixa/CaixaResumo"
import CaixaMovimentacoes from "../../components/admin/caixa/CaixaMovimentacoes"
import CaixaHistorico from "../../components/admin/caixa/CaixaHistorico"
import AbrirCaixaModal from "../../components/admin/caixa/AbrirCaixaModal"
import FecharCaixaModal from "../../components/admin/caixa/FecharCaixaModal"
import NovaMovimentacaoModal from "../../components/admin/caixa/NovaMovimentacaoModal"
import {
  calcularResumoMovimentacoes,
  formatarDataHora,
  formatarMoeda
} from "../../utils/caixa"

export default function Caixa() {
  const navigate = useNavigate()

  const [caixaAberto, setCaixaAberto] = useState(null)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [caixasFechados, setCaixasFechados] = useState([])
  const [loading, setLoading] = useState(true)

  const [abrirModal, setAbrirModal] = useState(false)
  const [fecharModal, setFecharModal] = useState(false)
  const [movimentacaoModalAberto, setMovimentacaoModalAberto] = useState(false)
  const [tipoMovimentacaoInicial, setTipoMovimentacaoInicial] = useState("saida")
  const [caixaHistoricoSelecionado, setCaixaHistoricoSelecionado] = useState(null)
  const [movimentacoesHistorico, setMovimentacoesHistorico] = useState([])
  const [historicoModalAberto, setHistoricoModalAberto] = useState(false)

  const resumo = useMemo(() => {
    return calcularResumoMovimentacoes(movimentacoes)
  }, [movimentacoes])

  const resumoHistorico = useMemo(() => {
    return calcularResumoMovimentacoes(movimentacoesHistorico)
  }, [movimentacoesHistorico])

  async function carregarTudo() {
    setLoading(true)

    const { data: caixaAtual } = await supabase
      .from("caixas")
      .select("*")
      .eq("status", "aberto")
      .order("aberto_em", { ascending: false })
      .limit(1)

    const caixa = caixaAtual?.[0] || null
    setCaixaAberto(caixa)

    if (caixa) {
      const { data: movs } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .eq("caixa_id", caixa.id)
        .order("criado_em", { ascending: false })

      setMovimentacoes(movs || [])
    } else {
      setMovimentacoes([])
    }

    const { data: fechados } = await supabase
      .from("caixas")
      .select("*")
      .eq("status", "fechado")
      .order("fechado_em", { ascending: false })
      .limit(20)

    setCaixasFechados(fechados || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  async function handleAbrirCaixa({ valorInicial, observacao }) {
    const valor = Number(valorInicial || 0)

    if (caixaAberto) {
      alert("Já existe um caixa aberto.")
      return
    }

    const { data: novoCaixa, error } = await supabase
      .from("caixas")
      .insert({
        status: "aberto",
        valor_inicial: valor,
        observacao_abertura: observacao || null
      })
      .select()
      .single()

    if (error) {
      console.log(error)
      alert("Erro ao abrir caixa.")
      return
    }

    await supabase
      .from("movimentacoes_caixa")
      .insert({
        caixa_id: novoCaixa.id,
        tipo: "abertura",
        origem: "sistema",
        descricao: "Abertura de caixa",
        valor,
        forma_pagamento: "dinheiro"
      })

    setAbrirModal(false)
    carregarTudo()
  }

  async function abrirHistoricoCaixa(caixa) {
  setCaixaHistoricoSelecionado(caixa)
  setHistoricoModalAberto(true)

  const { data, error } = await supabase
    .from("movimentacoes_caixa")
    .select("*")
    .eq("caixa_id", caixa.id)
    .order("criado_em", { ascending: false })

  if (error) {
    console.log(error)
    setMovimentacoesHistorico([])
    return
  }

  setMovimentacoesHistorico(data || [])
}

  async function handleNovaMovimentacao({
  tipo,
  valor,
  formaPagamento,
  descricao
}) {
  if (!caixaAberto) {
    alert("Abra um caixa antes de lançar movimentações.")
    return
  }

  const valorNumero = Number(valor || 0)

  if (!valorNumero || valorNumero <= 0) {
    alert("Informe um valor válido.")
    return
  }

  const { error } = await supabase
    .from("movimentacoes_caixa")
    .insert({
      caixa_id: caixaAberto.id,
      tipo,
      origem: "manual",
      descricao: descricao || null,
      valor: valorNumero,
      forma_pagamento: formaPagamento || null
    })

  if (error) {
    console.log(error)
    alert("Erro ao salvar movimentação.")
    return
  }

  setMovimentacaoModalAberto(false)
  carregarTudo()
}

  async function handleFecharCaixa({ valorFinalInformado, observacao }) {
    if (!caixaAberto) return

    const valorFinal = Number(valorFinalInformado || 0)

    const { error } = await supabase
      .from("caixas")
      .update({
        status: "fechado",
        fechado_em: new Date().toISOString(),
        valor_final_informado: valorFinal,
        observacao_fechamento: observacao || null
      })
      .eq("id", caixaAberto.id)

    if (error) {
      console.log(error)
      alert("Erro ao fechar caixa.")
      return
    }

    setFecharModal(false)
    carregarTudo()
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/admin")}
          className="text-zinc-400 hover:text-white mb-4"
        >
          ← Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            <p className="text-zinc-400">
              Controle de abertura, fechamento e movimentações do caixa.
            </p>
          </div>

<div className="flex gap-2 flex-wrap">
  {!caixaAberto ? (
    <button
      onClick={() => setAbrirModal(true)}
      className="bg-green-500 text-black px-4 py-2 rounded-xl font-semibold"
    >
      Abrir caixa
    </button>
  ) : (
    <>
      <button
        onClick={() => {
          setTipoMovimentacaoInicial("saida")
          setMovimentacaoModalAberto(true)
        }}
        className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
      >
        Nova saída
      </button>

      <button
        onClick={() => {
          setTipoMovimentacaoInicial("sangria")
          setMovimentacaoModalAberto(true)
        }}
        className="bg-orange-500 text-black px-4 py-2 rounded-xl font-semibold"
      >
        Sangria
      </button>

      <button
        onClick={() => {
          setTipoMovimentacaoInicial("ajuste")
          setMovimentacaoModalAberto(true)
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold"
      >
        Ajuste
      </button>

      <button
        onClick={() => setFecharModal(true)}
        className="bg-zinc-100 text-black px-4 py-2 rounded-xl font-semibold"
      >
        Fechar caixa
      </button>
    </>
  )}
</div>
        </div>

        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-400">
            Carregando caixa...
          </div>
        ) : (
          <>
            {caixaAberto ? (
              <>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
                  <p className="text-sm text-zinc-400">Caixa aberto em</p>
                  <p className="text-lg font-bold text-yellow-500">
                    {formatarDataHora(caixaAberto.aberto_em)}
                  </p>

                  {caixaAberto.observacao_abertura && (
                    <p className="text-sm text-zinc-400 mt-2">
                      Observação: {caixaAberto.observacao_abertura}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <CaixaResumo caixa={caixaAberto} resumo={resumo} />
                </div>

                <div className="mb-6">
                  <CaixaMovimentacoes movimentacoes={movimentacoes} />
                </div>
              </>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
                <p className="text-zinc-400">Nenhum caixa aberto no momento.</p>
              </div>
            )}

            <CaixaHistorico
              caixasFechados={caixasFechados}
              onAbrirHistorico={abrirHistoricoCaixa}
            />
          </>
        )}

        <AbrirCaixaModal
          aberto={abrirModal}
          onClose={() => setAbrirModal(false)}
          onConfirm={handleAbrirCaixa}
        />

        <FecharCaixaModal
          aberto={fecharModal}
          onClose={() => setFecharModal(false)}
          onConfirm={handleFecharCaixa}
          resumo={resumo}
        />

        <NovaMovimentacaoModal
        aberto={movimentacaoModalAberto}
        tipoInicial={tipoMovimentacaoInicial}
        onClose={() => setMovimentacaoModalAberto(false)}
        onConfirm={handleNovaMovimentacao}
      />

      {historicoModalAberto && caixaHistoricoSelecionado && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Detalhes do caixa</h2>
          <p className="text-zinc-400 text-sm">
            Aberto em {formatarDataHora(caixaHistoricoSelecionado.aberto_em)}
          </p>
        </div>

        <button
          onClick={() => {
            setHistoricoModalAberto(false)
            setCaixaHistoricoSelecionado(null)
            setMovimentacoesHistorico([])
          }}
          className="bg-red-500 text-white px-3 py-2 rounded-xl"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Valor inicial</p>
          <p className="text-yellow-500 font-bold">
            {formatarMoeda(caixaHistoricoSelecionado.valor_inicial)}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Final informado</p>
          <p className="text-green-400 font-bold">
            {formatarMoeda(caixaHistoricoSelecionado.valor_final_informado)}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Entradas</p>
          <p className="text-green-400 font-bold">
            {formatarMoeda(resumoHistorico.entradas)}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Saídas</p>
          <p className="text-red-400 font-bold">
            {formatarMoeda(resumoHistorico.saidas)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-400 mb-1">Observação de abertura</p>
          <p>{caixaHistoricoSelecionado.observacao_abertura || "Sem observação"}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-400 mb-1">Observação de fechamento</p>
          <p>{caixaHistoricoSelecionado.observacao_fechamento || "Sem observação"}</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-4">Movimentações do caixa</h3>

        {movimentacoesHistorico.length === 0 ? (
          <p className="text-zinc-400">Nenhuma movimentação encontrada.</p>
        ) : (
          <div className="grid gap-3">
            {movimentacoesHistorico.map((mov) => (
              <div
                key={mov.id}
                className="border border-zinc-800 rounded-xl p-4 bg-black"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {mov.descricao || mov.tipo}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {mov.tipo} • {mov.forma_pagamento || "sem forma"}
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
                      {mov.origem}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  )
}