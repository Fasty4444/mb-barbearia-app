import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function PaginaCliente() {
  const navigate = useNavigate()

  const [arquivo, setArquivo] = useState(null)
  const [legenda, setLegenda] = useState("")
  const [ordem, setOrdem] = useState(0)
  const [ativo, setAtivo] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [fotos, setFotos] = useState([])
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  useEffect(() => {
    buscarFotos()
  }, [])

  async function buscarFotos() {
    const { data, error } = await supabase
      .from("galeria_home")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.log("Erro ao buscar fotos:", error)
      return
    }

    setFotos(data || [])
  }

  async function handleUpload(e) {
    e.preventDefault()
    setMensagem("")
    setErro("")

    if (!arquivo) {
      setErro("Selecione uma imagem.")
      return
    }

    try {
      setEnviando(true)

      const extensao = arquivo.name.split(".").pop()
      const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`
      const caminhoArquivo = `home/${nomeArquivo}`

      const { error: uploadError } = await supabase.storage
        .from("galeria-home")
        .upload(caminhoArquivo, arquivo, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from("galeria-home")
        .getPublicUrl(caminhoArquivo)

      const imagem_url = publicUrlData?.publicUrl

      const { error: insertError } = await supabase
        .from("galeria_home")
        .insert({
          imagem_url,
          legenda,
          ordem: Number(ordem) || 0,
          ativo,
        })

      if (insertError) {
        throw insertError
      }

      setArquivo(null)
      setLegenda("")
      setOrdem(0)
      setAtivo(true)
      setMensagem("Foto adicionada com sucesso.")
      buscarFotos()

      const inputFile = document.getElementById("input-foto-home")
      if (inputFile) inputFile.value = ""
    } catch (err) {
      console.log(err)
      setErro(err.message || "Erro ao enviar imagem.")
    } finally {
      setEnviando(false)
    }
  }

  async function alternarStatus(foto) {
    const { error } = await supabase
      .from("galeria_home")
      .update({ ativo: !foto.ativo })
      .eq("id", foto.id)

    if (error) {
      console.log(error)
      setErro("Não foi possível alterar o status da foto.")
      return
    }

    buscarFotos()
  }

  async function excluirFoto(foto) {
    const confirmar = window.confirm("Deseja realmente excluir esta foto?")
    if (!confirmar) return

    try {
      const caminhoStorage = foto.imagem_url.split("/storage/v1/object/public/galeria-home/")[1]

      if (caminhoStorage) {
        await supabase.storage
          .from("galeria-home")
          .remove([caminhoStorage])
      }

      const { error } = await supabase
        .from("galeria_home")
        .delete()
        .eq("id", foto.id)

      if (error) {
        throw error
      }

      setMensagem("Foto excluída com sucesso.")
      buscarFotos()
    } catch (err) {
      console.log(err)
      setErro(err.message || "Erro ao excluir foto.")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <button
        onClick={() => navigate("/admin")}
        className="text-zinc-400 hover:text-white mb-4"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl mb-2">Configurações da Página do cliente</h1>
      <p className="text-zinc-400 mb-8">
        Gerencie as fotos exibidas na seção “Cortes realizados” da home.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Adicionar nova foto</h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Imagem
              </label>
              <input
                id="input-foto-home"
                type="file"
                accept="image/*"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Legenda
              </label>
              <input
                type="text"
                value={legenda}
                onChange={(e) => setLegenda(e.target.value)}
                placeholder="Ex: Corte low fade com acabamento na navalha"
                className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Ordem
              </label>
              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <span className="text-sm text-zinc-300">Deixar foto ativa</span>
            </label>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl p-3">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Salvar foto"}
            </button>
          </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Fotos cadastradas</h2>

          <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
            {fotos.length > 0 ? (
              fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                >
                  <img
                    src={foto.imagem_url}
                    alt={foto.legenda || "Foto da galeria"}
                    className="w-full h-56 object-cover rounded-xl mb-4"
                  />

                  <div className="space-y-1 mb-4">
                    <p className="font-semibold text-white">
                      {foto.legenda || "Sem legenda"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Ordem: {foto.ordem ?? 0}
                    </p>
                    <p className="text-sm">
                      Status:{" "}
                      <span className={foto.ativo ? "text-green-400" : "text-red-400"}>
                        {foto.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => alternarStatus(foto)}
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        foto.ativo
                          ? "bg-zinc-700 text-white"
                          : "bg-green-500 text-black"
                      }`}
                    >
                      {foto.ativo ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      onClick={() => excluirFoto(foto)}
                      className="px-4 py-2 rounded-xl font-semibold bg-red-500 text-white"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-zinc-400">
                Nenhuma foto cadastrada ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}