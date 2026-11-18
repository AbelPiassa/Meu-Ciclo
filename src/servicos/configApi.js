// Configuração da API Node.js/Express do Abel (backend/).
// Em desenvolvimento, defina EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:3000/api).
// - Emulador Android: http://10.0.2.2:3000/api
// - Celular físico: IP do computador na mesma rede (e rodar a API com HOST=0.0.0.0)
// O valor é lido na inicialização do bundle (Expo inclui variáveis EXPO_PUBLIC_*).
const URL_PADRAO = "http://127.0.0.1:3000/api";
const urlDoAmbiente = process.env.EXPO_PUBLIC_API_URL;

const config = {
  urlBase: normalizarUrl(urlDoAmbiente) || URL_PADRAO,
  tempoLimiteMs: 10000,
};

function normalizarUrl(valor) {
  return typeof valor === "string" ? valor.trim().replace(/\/+$/, "") : "";
}

export function obterConfigApi() {
  return config;
}

// Usado pelos testes automatizados e para depuração; não persiste nada.
export function configurarApi({ urlBase, tempoLimiteMs } = {}) {
  if (urlBase !== undefined) {
    config.urlBase = normalizarUrl(urlBase) || URL_PADRAO;
  }
  if (tempoLimiteMs !== undefined) {
    config.tempoLimiteMs = tempoLimiteMs;
  }
}
