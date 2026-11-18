const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export async function requisicao(
  caminho,
  { metodo = "GET", dados, token } = {}
) {
  if (!API_URL) {
    throw new Error("Endereço da API não configurado.");
  }

  const headers = { Accept: "application/json" };

  if (dados !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      signal: controller.signal,
      headers,
      body: dados === undefined ? undefined : JSON.stringify(dados),
    });
  } catch {
    throw new Error("Não foi possível conectar à API ou o tempo de espera terminou.");
  } finally {
    clearTimeout(timer);
  }

  if (resposta.status === 204) {
    return null;
  }

  const conteudo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(
      conteudo?.erro?.mensagem || "Não foi possível concluir a operação."
    );

    erro.status = resposta.status;
    erro.codigo = conteudo?.erro?.codigo;
    erro.campos = conteudo?.erro?.campos;

    throw erro;
  }

  return conteudo;
}
