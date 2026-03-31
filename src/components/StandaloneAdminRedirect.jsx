import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  )
}

export default function StandaloneAdminRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const path = location.pathname

    // salva última rota acessada do admin
    if (path.startsWith("/admin")) {
      localStorage.setItem("ultimo_admin_path", path)
    }

    // se abriu pela tela inicial em modo standalone
    // e caiu na home "/", tenta voltar para o admin
    if (isStandaloneMode() && path === "/") {
      const adminAutorizado = localStorage.getItem("admin_autorizado") === "true"
      const ultimoAdminPath = localStorage.getItem("ultimo_admin_path") || "/admin"

      if (adminAutorizado) {
        navigate(ultimoAdminPath, { replace: true })
      }
    }
  }, [location.pathname, navigate])

  return null
}