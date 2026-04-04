import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"

function calcularPercentualOff(preco, precoPromocional) {
  const valorOriginal = Number(preco || 0)
  const valorPromo = Number(precoPromocional || 0)

  if (!valorOriginal || !valorPromo || valorPromo >= valorOriginal) return 0

  return Math.round(((valorOriginal - valorPromo) / valorOriginal) * 100)
}

function temPromocao(servico) {
  const valorOriginal = Number(servico?.preco || 0)
  const valorPromo = Number(servico?.preco_promocional || 0)

  return valorPromo > 0 && valorPromo < valorOriginal
}

export default function Servicos(){
  const [servicos, setServicos] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [nome, setNome] = useState("")
  const [preco, setPreco] = useState("")
  const [precoPromocional, setPrecoPromocional] = useState("")
  const [duracao, setDuracao] = useState("")
  const [modalNovo, setModalNovo] = useState(false)
  const navigate = useNavigate()

  async function carregar(){
    const { data } = await supabase
      .from("servicos")
      .select("*")
      .order("preco")

    setServicos(data || [])
  }

  useEffect(()=>{
    carregar()
  }, [])

  async function salvarEdicao(id){
    await supabase
      .from("servicos")
      .update({
        nome,
        preco: Number(preco),
        preco_promocional: precoPromocional === "" ? null : Number(precoPromocional),
        duracao: Number(duracao)
      })
      .eq("id", id)

    setEditandoId(null)
    carregar()
  }

  async function toggleAtivo(servico){
    await supabase
      .from("servicos")
      .update({ ativo: !servico.ativo })
      .eq("id", servico.id)

    carregar()
  }

  async function adicionar(){
    if(!nome || !preco || !duracao){
      alert("Preencha nome, valor total e duração")
      return
    }

    await supabase
      .from("servicos")
      .insert({
        nome,
        preco: Number(preco),
        preco_promocional: precoPromocional === "" ? null : Number(precoPromocional),
        duracao: Number(duracao),
        ativo: true
      })

    setNome("")
    setPreco("")
    setPrecoPromocional("")
    setDuracao("")
    setModalNovo(false)
    carregar()
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="text-zinc-400 hover:text-white transition"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold">Serviços</h1>

          <button
            onClick={()=>setModalNovo(true)}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
          >
            + Novo
          </button>
        </div>

        <div className="space-y-4">
          {servicos.map(s => {
            const estaEditando = editandoId === s.id
            const promocaoAtiva = temPromocao(s)
            const percentualOff = calcularPercentualOff(s.preco, s.preco_promocional)

            return (
              <div
                key={s.id}
                className={`bg-zinc-900 border rounded-2xl p-5 flex justify-between items-center gap-4 ${
                  s.ativo ? "border-zinc-800" : "border-red-500 opacity-50"
                }`}
              >
                <div className="flex-1">
                  {estaEditando ? (
                    <>
                      <input
                        value={nome}
                        onChange={(e)=>setNome(e.target.value)}
                        className="bg-zinc-800 p-2 rounded mb-2 w-full"
                        placeholder="Nome do serviço"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={preco}
                          onChange={(e)=>setPreco(e.target.value)}
                          className="bg-zinc-800 p-2 rounded w-full"
                          placeholder="Valor total"
                        />

                        <input
                          type="number"
                          value={precoPromocional}
                          onChange={(e)=>setPrecoPromocional(e.target.value)}
                          className="bg-zinc-800 p-2 rounded w-full"
                          placeholder="Valor com desconto"
                        />

                        <input
                          type="number"
                          value={duracao}
                          onChange={(e)=>setDuracao(e.target.value)}
                          className="bg-zinc-800 p-2 rounded w-full"
                          placeholder="Duração (min)"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">{s.nome}</p>

                      {promocaoAtiva ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-zinc-500 line-through">
                            R$ {Number(s.preco || 0).toFixed(2)}
                          </span>
                          <span className="text-yellow-500 font-bold text-base">
                            R$ {Number(s.preco_promocional || 0).toFixed(2)}
                          </span>
                          <span className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                            {percentualOff}% OFF
                          </span>
                          <span className="text-zinc-400">• {s.duracao} min</span>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400">
                          R$ {Number(s.preco || 0).toFixed(2)} • {s.duracao} min
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 ml-4 shrink-0">
                  {estaEditando ? (
                    <>
                      <button
                        onClick={()=>salvarEdicao(s.id)}
                        className="bg-green-500 px-3 py-2 rounded"
                      >
                        Salvar
                      </button>

                      <button
                        onClick={()=>setEditandoId(null)}
                        className="bg-zinc-700 px-3 py-2 rounded"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={()=>{
                          setEditandoId(s.id)
                          setNome(s.nome)
                          setPreco(s.preco)
                          setPrecoPromocional(s.preco_promocional ?? "")
                          setDuracao(s.duracao)
                        }}
                        className="bg-yellow-500 text-black px-3 py-2 rounded"
                      >
                        Editar
                      </button>

                      <button
                        onClick={()=>toggleAtivo(s)}
                        className={`px-3 py-2 rounded ${
                          s.ativo ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {s.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modalNovo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl mb-4">Novo serviço</h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e)=>setNome(e.target.value)}
              className="w-full p-3 mb-3 bg-zinc-800 rounded"
            />

            <input
              placeholder="Valor total"
              type="number"
              value={preco}
              onChange={(e)=>setPreco(e.target.value)}
              className="w-full p-3 mb-3 bg-zinc-800 rounded"
            />

            <input
              placeholder="Valor com desconto (opcional)"
              type="number"
              value={precoPromocional}
              onChange={(e)=>setPrecoPromocional(e.target.value)}
              className="w-full p-3 mb-3 bg-zinc-800 rounded"
            />

            <input
              placeholder="Duração (min)"
              type="number"
              value={duracao}
              onChange={(e)=>setDuracao(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 rounded"
            />

            <div className="flex gap-2">
              <button
                onClick={adicionar}
                className="bg-green-500 text-black px-4 py-2 rounded w-full"
              >
                Salvar
              </button>

              <button
                onClick={()=>setModalNovo(false)}
                className="bg-zinc-700 px-4 py-2 rounded w-full"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
