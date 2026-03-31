import { useEffect, useState } from "react"
import { pedirPermissaoPush } from "../lib/onesignal"

export default function AvisoPush() {
  const [visivel, setVisivel] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [suportaNotificacao, setSuportaNotificacao] = useState(false)

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

  if (!visivel) return null

  return (
    <div className="px-6 pt-6">
      <div className="w-full max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative">
        <button
          onClick={fecharAviso}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
        >
          ✕
        </button>

        {!isIOS && (
          <>
            <h2 className="text-lg font-bold text-yellow-500 mb-2">
              Ative as notificações
            </h2>

            <p className="text-zinc-300 mb-4">
              Permita as notificações para receber lembretes do seu horário e avisos importantes da MB Barbearia.
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

        {isIOS && !isStandalone && (
          <>
            <h2 className="text-lg font-bold text-yellow-500 mb-2">
              Ative as notificações no iPhone
            </h2>

            <p className="text-zinc-300 mb-4">
              Para receber lembretes do seu horário no iPhone, primeiro adicione a MB Barbearia à Tela Inicial.
            </p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 space-y-2">
              <p><strong>1.</strong> Abra este site no Safari</p>
              <p><strong>2.</strong> Toque em <strong>Compartilhar</strong></p>
              <p><strong>3.</strong> Toque em <strong>Adicionar à Tela Inicial</strong></p>
              <p><strong>4.</strong> Abra a MB Barbearia pelo ícone da Tela Inicial</p>
              <p><strong>5.</strong> Depois permita as notificações quando solicitado</p>
            </div>

            <button
              onClick={fecharAviso}
              className="mt-4 px-4 py-3 rounded-xl font-semibold bg-yellow-500 text-black"
            >
              Entendi
            </button>
          </>
        )}

        {isIOS && isStandalone && (
          <>
            <h2 className="text-lg font-bold text-yellow-500 mb-2">
              Ative as notificações
            </h2>

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