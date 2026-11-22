// Rede de Apoio usa exclusivamente a sessão e o cliente HTTP compartilhados.
import { obterSessao, requisicaoAutenticada } from './sessao.js';

function exigirSessao() {
  const sessao = obterSessao();
  if (!sessao) {
    const erro = new Error('Entre na sua conta para acessar seus contatos.');
    erro.status = 401;
    throw erro;
  }
  return sessao;
}

function exigirId(id) {
  const numero = Number(id);
  if (!Number.isSafeInteger(numero) || numero < 1) throw new Error('ID de contato inválido.');
  return numero;
}

async function chamarApi(caminho, metodo = 'GET', dados) {
  const sessao = exigirSessao();
  try {
    const resposta = await requisicaoAutenticada(caminho, { metodo, dados });
    // Não entregar resultados da conta anterior após logout ou troca de perfil.
    if (obterSessao() !== sessao) throw new Error('Sessão alterada. Entre novamente.');
    if (metodo !== 'DELETE' && resposta === null) throw new Error('Resposta inesperada da API.');
    return resposta;
  } catch (erro) {
    const campo = erro.campos?.[0];
    if (campo) erro.message += ` (${campo.campo}: ${campo.mensagem})`;
    throw erro;
  }
}

function dadosParaApi(contato) {
  return {
    id_perfil: exigirSessao().id_perfil,
    nome: contato.nome.trim(),
    telefone: contato.telefone.replace(/\D/g, ''),
    relacionamento: contato.relacionamento.trim(),
    alerta_automatico: contato.alerta_automatico ?? false,
    observacoes: contato.observacoes ?? '',
  };
}

export async function listarContatos() {
  const lista = await chamarApi('/api/contatos');
  if (!Array.isArray(lista)) throw new Error('A API não retornou uma lista de contatos.');
  return lista;
}
export function buscarContato(id) {
  return chamarApi(`/api/contatos/${exigirId(id)}`);
}
export function criarContato(contato) {
  return chamarApi('/api/contatos', 'POST', dadosParaApi(contato));
}
export function atualizarContato(id, contato) {
  return chamarApi(`/api/contatos/${exigirId(id)}`, 'PUT', dadosParaApi(contato));
}
export function excluirContato(id) {
  return chamarApi(`/api/contatos/${exigirId(id)}`, 'DELETE');
}
