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

    if (path.startsWith("/admin")) {
      localStorage.setItem("ultimo_admin_path", path)
    }

    if (isStandaloneMode() && path === "/") {
      const adminAutorizado = localStorage.getItem("admin_autorizado") === "true"
      const atalhoAdmin = localStorage.getItem("atalho_admin") === "true"

      if (adminAutorizado && atalhoAdmin) {
        navigate("/admin/dashboard", { replace: true })
      }
    }
  }, [location.pathname, navigate])

  return null
}