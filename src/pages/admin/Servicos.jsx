import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Servicos(){

  const [servicos, setServicos] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [nome, setNome] = useState("")
  const [preco, setPreco] = useState("")
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
      .update({ nome, preco, duracao })
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
      alert("Preencha tudo")
      return
    }

    await supabase
      .from("servicos")
      .insert({
        nome,
        preco: Number(preco),
        duracao: Number(duracao),
        ativo: true
      })

    setNome("")
    setPreco("")
    setDuracao("")
    setModalNovo(false)
    carregar()
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">

      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
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

        {/* LISTA */}
        <div className="space-y-4">

          {servicos.map(s => {

            const estaEditando = editandoId === s.id

            return (
              <div
                key={s.id}
                className={`bg-zinc-900 border rounded-2xl p-5 flex justify-between items-center ${
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
                      />

                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={preco}
                          onChange={(e)=>setPreco(e.target.value)}
                          className="bg-zinc-800 p-2 rounded w-full"
                        />

                        <input
                          type="number"
                          value={duracao}
                          onChange={(e)=>setDuracao(e.target.value)}
                          className="bg-zinc-800 p-2 rounded w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">{s.nome}</p>
                      <p className="text-sm text-zinc-400">
                        R$ {s.preco} • {s.duracao} min
                      </p>
                    </>
                  )}

                </div>

                <div className="flex gap-2 ml-4">

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

      {/* MODAL NOVO SERVIÇO */}
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
              placeholder="Preço"
              type="number"
              value={preco}
              onChange={(e)=>setPreco(e.target.value)}
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