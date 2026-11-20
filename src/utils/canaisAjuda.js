// Só os canais oficiais abaixo podem ser abertos no discador.
const NUMEROS_OFICIAIS = ["180", "190"];

// Número do canal (ex.: "Ligue 180" -> "180"); vazio se não for um canal oficial.
export function numeroDoCanal(canal) {
  const numero = String(canal?.numero ?? "").replace(/\D/g, "");
  return NUMEROS_OFICIAIS.includes(numero) ? numero : "";
}

// Endereço "tel:" que abre o discador com o número preenchido (não realiza a chamada).
export function enderecoDoDiscador(canal) {
  const numero = numeroDoCanal(canal);
  return numero ? `tel:${numero}` : "";
}
