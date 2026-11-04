const MS_DIA = 24 * 60 * 60 * 1000;

// Mantém até oito números e acrescenta as barras durante a digitação (DD/MM/AAAA).
export function formatarData(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

// Aceita só datas existentes no formato DD/MM/AAAA (rejeita, por exemplo, 31/02/2026).
export function dataValida(valor) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    return false;
  }

  const [dia, mes, ano] = valor.split("/").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return ano > 0 &&
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
}

export function textoParaData(texto) {
  const [dia, mes, ano] = texto.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function dataParaTexto(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

export function somarDias(data, dias) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

// Diferença em dias inteiros (b - a); o arredondamento absorve a troca de horário de verão.
export function diasEntre(a, b) {
  return Math.round((b - a) / MS_DIA);
}
