import { useNavigate, useSearchParams } from "react-router-dom"

export default function ResponderLembrete() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const id = searchParams.get("id")

  function irConfirmar() {
    navigate(`/confirmar?id=${id}`)
  }

  function irCancelar() {
    navigate(`/cancelar?id=${id}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center mb-3">
          MB Prime - Barbearia
        </h1>

        <p className="text-zinc-300 text-center mb-6">
          Deseja confirmar ou cancelar seu agendamento?
        </p>

        <div className="grid gap-3">
          <button
            onClick={irConfirmar}
            className="w-full bg-green-500 text-black font-semibold py-3 rounded-xl"
          >
            Confirmar presença
          </button>

          <button
            onClick={irCancelar}
            className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl"
          >
            Cancelar agendamento
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-zinc-800 text-white py-3 rounded-xl"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}