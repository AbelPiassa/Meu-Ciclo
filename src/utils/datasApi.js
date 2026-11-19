// Conversão entre o formato do app (DD/MM/AAAA) e o da API (AAAA-MM-DD).

export function brParaIso(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto ?? ""));
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : null;
}

export function isoParaBr(iso) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : "";
}

// Data de hoje no fuso do aparelho, em AAAA-MM-DD (evita o desvio de UTC do toISOString).
export function hojeIso(agora = new Date()) {
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
