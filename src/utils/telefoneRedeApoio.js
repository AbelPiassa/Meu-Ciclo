/** Máscara de telefone brasileiro somente para o formulário da Rede de Apoio. */
export function formatarTelefone(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (!numeros) return "";
  if (numeros.length <= 2) return `(${numeros}`;
  const ddd = numeros.slice(0, 2);
  const restante = numeros.slice(2);
  if (restante.length <= 4) return `(${ddd}) ${restante}`;
  if (numeros.length <= 10) {
    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`;
  }
  return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5)}`;
}

/** Validação de formato, não confirma existência/posse do número. */
export function telefoneValido(telefone) {
  const numeros = String(telefone ?? "").replace(/\D/g, "");
  return (numeros.length === 10 || numeros.length === 11) && numeros.slice(0, 2) !== "00";
}
