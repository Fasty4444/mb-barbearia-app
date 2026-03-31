import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function StandaloneAdminRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const path = location.pathname
    const atalhoAdmin = localStorage.getItem("atalho_admin") === "true"
    const adminAutorizado = localStorage.getItem("admin_autorizado") === "true"

    if (path.startsWith("/admin")) {
      localStorage.setItem("ultimo_admin_path", path)
    }

    if (path === "/" && atalhoAdmin && adminAutorizado) {
      navigate("/admin", { replace: true })
    }
  }, [location.pathname, navigate])

  return null
}