// Tradução das mensagens de validação devolvidas pela API (backend/docs/API.md).
// O Zod do backend devolve parte das mensagens em inglês; traduzimos as conhecidas
// e mantemos as que já vêm em português (ex.: "Data inexistente; use AAAA-MM-DD.").
export function traduzirMensagemCampo(mensagem) {
  const texto = String(mensagem ?? "");
  if (/^Too small/i.test(texto) || /^Invalid input: expected string, received undefined/i.test(texto)) {
    return "Preencha este campo.";
  }
  if (/^Too big/i.test(texto)) {
    return "Texto longo demais.";
  }
  if (/Data inexistente/i.test(texto)) {
    return "Data inexistente.";
  }
  if (/[À-ÿ]/.test(texto)) {
    return texto;
  }
  return "Valor inválido.";
}
// Junta os erros de campo em uma frase única: "Data: Data inexistente. Descrição: Preencha este campo."
export function detalharCampos(campos, rotulos = {}) {
  if (!Array.isArray(campos) || campos.length === 0) {
    return "";
  }
  return campos
    .map(({ campo, mensagem }) => `${rotulos[campo] ?? campo}: ${traduzirMensagemCampo(mensagem)}`)
    .join(" ");
}
