import { motion } from "framer-motion"

export default function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >

        <motion.img
          src="/logo.png"
          alt="MB Barbearia"
          className="w-24 mx-auto mb-6"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <h1 className="text-3xl font-bold text-yellow-500">
          MB Barbearia
        </h1>

        <p className="text-zinc-400 mt-2">
          Carregando experiência premium...
        </p>

      </motion.div>

    </div>
  )
}