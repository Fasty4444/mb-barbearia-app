import { useEffect, useState } from "react"
import { pedirPermissaoPush } from "../lib/onesignal"
import { Bell, Share, PlusSquare, Smartphone, CheckCircle2 } from "lucide-react"

export default function AvisoPush() {
  const [visivel, setVisivel] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [suportaNotificacao, setSuportaNotificacao] = useState(false)
  const [mostrarPassoFinalIOS, setMostrarPassoFinalIOS] = useState(false)

  useEffect(() => {
    try {
      const ios =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

      const standalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.navigator.standalone === true

      const suporta = typeof window !== "undefined" && "Notification" in window
      const permitido = suporta ? Notification.permission === "granted" : false
      const fechado = localStorage.getItem("mb_push_aviso_fechado")

      setIsIOS(ios)
      setIsStandalone(standalone)
      setSuportaNotificacao(suporta)

      if (ios && !standalone) {
        setVisivel(true)
        return
      }

      if (!fechado && !permitido) {
        setVisivel(true)
      }
    } catch (error) {
      console.log("Erro ao montar aviso push:", error)
    }
  }, [])

  function fecharAviso() {
    localStorage.setItem("mb_push_aviso_fechado", "true")
    setVisivel(false)
  }

  async function ativarNotificacoes() {
    try {
      setCarregando(true)
      await pedirPermissaoPush()
      setVisivel(false)
      localStorage.setItem("mb_push_aviso_fechado", "true")
    } catch (error) {
      console.log("Erro ao pedir permissão do push:", error)
    } finally {
      setCarregando(false)
    }
  }

  function jaAdicioneiTelaInicial() {
    setMostrarPassoFinalIOS(true)
  }

  if (!visivel) return null

  return (
    <div className="px-6 pt-6">
      <div className="w-full max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative shadow-xl">
        <button
          onClick={fecharAviso}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
        >
          ✕
        </button>

        {!isIOS && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Bell className="text-yellow-500" size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-yellow-500">
                  Ative as notificações
                </h2>
                <p className="text-sm text-zinc-400">
                  Receba lembretes do seu horário na MB Barbearia
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-4">
              Permita as notificações para receber avisos do seu agendamento e não esquecer seu horário.
            </p>

            {suportaNotificacao ? (
              <button
                onClick={ativarNotificacoes}
                disabled={carregando}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  carregando
                    ? "bg-yellow-700 text-black opacity-70 cursor-not-allowed"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {carregando ? "Ativando..." : "Permitir notificações"}
              </button>
            ) : (
              <p className="text-sm text-zinc-400">
                Seu navegador não suporta notificações neste momento.
              </p>
            )}
          </>
        )}

        {isIOS && !isStandalone && !mostrarPassoFinalIOS && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Smartphone className="text-yellow-500" size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-yellow-500">
                  Ative as notificações no iPhone
                </h2>
                <p className="text-sm text-zinc-400">
                  Primeiro adicione a barbearia à Tela Inicial
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-4">
              No iPhone, as notificações funcionam melhor quando o site é aberto pela Tela Inicial.
            </p>

            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Share className="text-yellow-500" size={18} />
                  <p className="font-semibold">Passo 1</p>
                </div>
                <p className="text-sm text-zinc-300">
                  Toque em <strong>Compartilhar</strong> no Safari.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PlusSquare className="text-yellow-500" size={18} />
                  <p className="font-semibold">Passo 2</p>
                </div>
                <p className="text-sm text-zinc-300">
                  Toque em <strong>Adicionar à Tela Inicial</strong>.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="text-yellow-500" size={18} />
                  <p className="font-semibold">Passo 3</p>
                </div>
                <p className="text-sm text-zinc-300">
                  Abra a MB Barbearia pelo novo ícone e ative as notificações.
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-dashed border-yellow-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-300">
                Dica: no Safari, o botão <strong>Compartilhar</strong> é o ícone de seta saindo de um quadrado.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={jaAdicioneiTelaInicial}
                className="px-4 py-3 rounded-xl font-semibold bg-yellow-500 text-black"
              >
                Já adicionei à Tela Inicial
              </button>

              <button
                onClick={fecharAviso}
                className="px-4 py-3 rounded-xl font-semibold bg-zinc-800 text-white"
              >
                Depois eu vejo
              </button>
            </div>
          </>
        )}

        {isIOS && !isStandalone && mostrarPassoFinalIOS && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="text-green-400" size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-yellow-500">
                  Último passo no iPhone
                </h2>
                <p className="text-sm text-zinc-400">
                  Agora abra a MB Barbearia pela Tela Inicial
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-300">
                Depois de abrir pelo ícone da Tela Inicial, volte aqui e toque em <strong>Permitir notificações</strong>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fecharAviso}
                className="px-4 py-3 rounded-xl font-semibold bg-yellow-500 text-black"
              >
                Entendi
              </button>
            </div>
          </>
        )}

        {isIOS && isStandalone && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Bell className="text-yellow-500" size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-yellow-500">
                  Ative as notificações
                </h2>
                <p className="text-sm text-zinc-400">
                  Agora sim, já pela Tela Inicial
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-4">
              Agora que a MB Barbearia está na sua Tela Inicial, ative as notificações para receber lembretes do seu horário.
            </p>

            {suportaNotificacao ? (
              <button
                onClick={ativarNotificacoes}
                disabled={carregando}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  carregando
                    ? "bg-yellow-700 text-black opacity-70 cursor-not-allowed"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {carregando ? "Ativando..." : "Permitir notificações"}
              </button>
            ) : (
              <p className="text-sm text-zinc-400">
                As notificações ainda não estão disponíveis nesta forma de abertura.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}