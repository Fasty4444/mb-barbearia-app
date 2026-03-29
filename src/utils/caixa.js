export function formatarMoeda(valor) {
  const numero = Number(valor || 0)

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

export function formatarDataHora(data) {
  if (!data) return "-"

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  })
}

export function formatarData(data) {
  if (!data) return "-"

  return new Date(data).toLocaleDateString("pt-BR")
}

export function calcularResumoMovimentacoes(movimentacoes = []) {
  const resumo = {
    entradas: 0,
    saidas: 0,
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    outro: 0,
    saldo: 0
  }

  movimentacoes.forEach((mov) => {
    const valor = Number(mov.valor || 0)

    if (mov.tipo === "entrada" || mov.tipo === "abertura" || mov.tipo === "ajuste") {
      resumo.entradas += valor
    }

    if (mov.tipo === "saida" || mov.tipo === "sangria") {
      resumo.saidas += valor
    }

    if (mov.tipo === "entrada") {
      if (mov.forma_pagamento === "dinheiro") resumo.dinheiro += valor
      if (mov.forma_pagamento === "pix") resumo.pix += valor
      if (mov.forma_pagamento === "debito") resumo.debito += valor
      if (mov.forma_pagamento === "credito") resumo.credito += valor
      if (mov.forma_pagamento === "outro") resumo.outro += valor
    }
  })

  resumo.saldo = resumo.entradas - resumo.saidas

  return resumo
}