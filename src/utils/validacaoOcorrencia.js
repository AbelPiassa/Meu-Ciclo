import { dataValida } from "./datas.js";
import { brParaIso, hojeIso } from "./datasApi.js";

export const LIMITE_DESCRICAO = 5000; // mesmo limite do backend
export const ANO_MINIMO = 1900;

// Valida os campos editáveis do Diário (data em DD/MM/AAAA).
// Mantém as mensagens que a tela já usava e acrescenta as regras novas.
export function validarOcorrencia({ data, descricao }, agora = new Date()) {
  const dataTexto = String(data ?? "").trim();
  const descricaoTexto = String(descricao ?? "").trim();

  if (!dataTexto || !descricaoTexto) {
    return { valido: false, mensagem: "Preencha a data e a descrição da ocorrência." };
  }
  if (!dataValida(dataTexto)) {
    return { valido: false, mensagem: "Informe uma data válida no formato DD/MM/AAAA." };
  }

  const iso = brParaIso(dataTexto);
  if (Number(iso.slice(0, 4)) < ANO_MINIMO) {
    return { valido: false, mensagem: `Informe uma data a partir de ${ANO_MINIMO}.` };
  }
  if (iso > hojeIso(agora)) {
    return { valido: false, mensagem: "A data da ocorrência não pode ser no futuro." };
  }
  if (descricaoTexto.length > LIMITE_DESCRICAO) {
    return { valido: false, mensagem: `A descrição pode ter no máximo ${LIMITE_DESCRICAO} caracteres.` };
  }
  return { valido: true, mensagem: "" };
}
