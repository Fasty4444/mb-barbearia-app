import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Feriados() {
  const navigate = useNavigate();
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [novoNome, setNovoNome] = useState("");
  const [novaData, setNovaData] = useState("");

  async function carregarFeriados() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const anoAtual = new Date().getFullYear();

      const [dbRes, apiRes] = await Promise.all([
        supabase
          .from("feriados")
          .select("id, data, nome, ativo")
          .order("data", { ascending: true }),

        fetch(`https://brasilapi.com.br/api/feriados/v1/${anoAtual}`),
      ]);

      if (dbRes.error) {
        throw new Error(`Erro ao buscar feriados do banco: ${dbRes.error.message}`);
      }

      let apiFeriados = [];
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        apiFeriados = Array.isArray(apiJson)
          ? apiJson.map((item) => ({
              id: null,
              data: item.date,
              nome: item.name,
              ativo: true,
              origem: "api",
            }))
          : [];
      }

      const bancoFeriados = (dbRes.data || []).map((item) => ({
        id: item.id,
        data: item.data,
        nome: item.nome,
        ativo: item.ativo ?? true,
        origem: "banco",
      }));

      // Mescla por data. O banco tem prioridade.
      const mapa = new Map();

      for (const item of apiFeriados) {
        mapa.set(item.data, item);
      }

      for (const item of bancoFeriados) {
        mapa.set(item.data, item);
      }

      const mesclados = Array.from(mapa.values()).sort((a, b) =>
        a.data.localeCompare(b.data)
      );

      setFeriados(mesclados);
    } catch (e) {
      console.error(e);
      setErro(e.message || "Erro ao carregar feriados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFeriados();
  }, []);

  function formatarDataBR(data) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
    }

    function handleNovaData(e) {
  let valor = e.target.value.replace(/\D/g, "");

  if (valor.length > 8) return;

  if (valor.length > 4) {
    valor = `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4)}`;
  } else if (valor.length > 2) {
    valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
  }

  setNovaData(valor);
}

  function alternarAtivo(data) {
    setFeriados((prev) =>
      prev.map((item) =>
        item.data === data ? { ...item, ativo: !item.ativo } : item
      )
    );
  }

  function atualizarNome(data, nome) {
    setFeriados((prev) =>
      prev.map((item) =>
        item.data === data ? { ...item, nome } : item
      )
    );
  }

function adicionarFeriado() {
  setErro("");
  setSucesso("");

  const nome = novoNome.trim();

  let data = null;

  if (novaData) {
    const numeros = novaData.replace(/\D/g, "");

    if (numeros.length !== 8) {
      setErro("Digite a data no formato dd/mm/aaaa.");
      return;
    }

    const dia = numeros.slice(0, 2);
    const mes = numeros.slice(2, 4);
    const ano = numeros.slice(4, 8);

    data = `${ano}-${mes}-${dia}`;
  }

    if (!nome) {
      setErro("Digite o nome do feriado.");
      return;
    }

    if (!data) {
      setErro("Selecione a data do feriado.");
      return;
    }

    const jaExiste = feriados.some((item) => item.data === data);
    if (jaExiste) {
      setErro("Já existe um feriado cadastrado nessa data.");
      return;
    }

    const novoItem = {
      id: null,
      data,
      nome,
      ativo: true,
      origem: "manual",
    };

    setFeriados((prev) =>
      [...prev, novoItem].sort((a, b) => a.data.localeCompare(b.data))
    );

    setNovoNome("");
    setNovaData("");
  }

  async function salvarFeriados() {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const payload = feriados.map((item) => ({
        data: item.data,
        nome: item.nome?.trim() || "Feriado",
        ativo: !!item.ativo,
      }));

      const { error } = await supabase
        .from("feriados")
        .upsert(payload, { onConflict: "data" });

      if (error) {
        throw new Error(error.message);
      }

      setSucesso("Feriados salvos com sucesso.");
      await carregarFeriados();
    } catch (e) {
      console.error(e);
      setErro(e.message || "Erro ao salvar feriados.");
    } finally {
      setSalvando(false);
    }
  }

  const quantidadeAtivos = useMemo(
    () => feriados.filter((item) => item.ativo).length,
    [feriados]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <button
            onClick={() => navigate("/admin")}
            className="mb-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
          >
            ← Voltar
          </button>
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
              Feriados
            </h1>
            <p className="text-zinc-400 mt-1">
              Gerencie os feriados oficiais e personalizados da barbearia.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={carregarFeriados}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
              disabled={loading || salvando}
            >
              Recarregar
            </button>

            <button
              onClick={salvarFeriados}
              className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-60"
              disabled={loading || salvando}
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
            <h2 className="text-lg font-semibold mb-4">Adicionar feriado manual</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome do feriado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="md:col-span-2 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

<input
  type="text"
  inputMode="numeric"
  placeholder="dd/mm/aaaa"
  value={novaData}
  onChange={handleNovaData}
  maxLength={10}
  className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
/>
            </div>

            <button
              onClick={adicionarFeriado}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
            >
              Adicionar
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
            <h2 className="text-lg font-semibold mb-3">Resumo</h2>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>Total de feriados: <span className="text-white font-semibold">{feriados.length}</span></p>
              <p>Ativos: <span className="text-green-400 font-semibold">{quantidadeAtivos}</span></p>
              <p>Inativos: <span className="text-red-400 font-semibold">{feriados.length - quantidadeAtivos}</span></p>
            </div>
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 text-red-300 px-4 py-3">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 rounded-xl border border-green-900 bg-green-950/40 text-green-300 px-4 py-3">
            {sucesso}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-4 md:px-5 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold">Lista de feriados</h2>
          </div>

          {loading ? (
            <div className="p-6 text-zinc-400">Carregando feriados...</div>
          ) : feriados.length === 0 ? (
            <div className="p-6 text-zinc-400">Nenhum feriado encontrado.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {feriados.map((item) => (
                <div
                  key={item.data}
                  className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Data</label>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200">
                        {formatarDataBR(item.data)}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 block mb-1">Nome</label>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) => atualizarNome(item.data, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${
                        item.ativo
                          ? "border-green-700 bg-green-950/50 text-green-400"
                          : "border-red-700 bg-red-950/50 text-red-400"
                      }`}
                    >
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>

                    <button
                      onClick={() => alternarAtivo(item.data)}
                      className={`px-4 py-2 rounded-xl transition font-medium ${
                        item.ativo
                          ? "bg-zinc-800 hover:bg-zinc-700"
                          : "bg-yellow-500 text-black hover:bg-yellow-400"
                      }`}
                    >
                      {item.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}