/* global document */
const $ = id => document.getElementById(id);
let token = '', ciclo = 0, timer, ocupado = false;
const estados = ['Novo', 'Em atendimento', 'Concluído'];
function mensagem(s) { $('mensagem').textContent = s; }
async function api(path, method = 'GET', body) {
  const resposta = await fetch('/painel/api' + path, {
    method, headers: { Authorization: 'Bearer ' + token, ...(body ? {'Content-Type':'application/json'} : {}) },
    ...(body ? {body: JSON.stringify(body)} : {}), cache: 'no-store'
  });
  if (!resposta.ok) { const e = new Error('HTTP ' + resposta.status); e.status = resposta.status; throw e; }
  return resposta.json();
}
function sair() {
  ciclo++; token = ''; clearTimeout(timer); ocupado = false;
  $('painel').hidden = true; $('acesso').hidden = false; $('lista').replaceChildren(); $('chave').value = '';
  $('entrar').disabled = false; mensagem('Painel desconectado.');
}
function render(alertas, atual) {
  const lista = $('lista'); lista.replaceChildren();
  const novos = alertas.filter(a => a.status === 'Novo').length;
  $('contagem').textContent = novos + ' novo(s) · ' + alertas.length + ' alerta(s)';
  if (!alertas.length) { const p = document.createElement('p'); p.textContent = 'Nenhum alerta de teste registrado.'; lista.append(p); }
  for (const a of alertas) {
    const card = document.createElement('article'); card.className = 'alerta' + (a.status === 'Novo' ? ' novo' : '');
    const h = document.createElement('h2'); h.textContent = '#' + a.id_alerta + ' · ' + a.conta_teste + ' · ' + a.status; card.append(h);
    for (const t of [new Date(a.criado_em).toLocaleString('pt-BR'), 'Latitude: ' + a.latitude + ' · Longitude: ' + a.longitude, 'Origem: ' + a.origem]) {
      const p = document.createElement('p'); p.textContent = t; card.append(p);
    }
    const select = document.createElement('select'); select.setAttribute('aria-label','Status do alerta ' + a.id_alerta);
    for (const s of estados) { const o = document.createElement('option'); o.value = s; o.textContent = s; select.append(o); }
    select.value = a.status;
    select.addEventListener('change', async () => {
      if (ciclo !== atual || ocupado) { select.value = a.status; return; }
      ocupado = true; clearTimeout(timer); select.disabled = true;
      try { await api('/alertas/' + a.id_alerta, 'PUT', {status:select.value}); }
      catch (e) { if (ciclo === atual) { if (e.status === 401) { sair(); mensagem('Chave inválida.'); } else mensagem('Falha ao atualizar status.'); } }
      finally { if (ciclo === atual) { ocupado = false; void atualizar(atual); } }
    });
    card.append(select); lista.append(card);
  }
}
async function atualizar(atual) {
  if (atual !== ciclo || ocupado || !token) return;
  ocupado = true;
  try {
    const alertas = await api('/alertas');
    if (atual !== ciclo) return;
    $('acesso').hidden = true; $('painel').hidden = false; render(alertas, atual);
    mensagem('Atualizado às ' + new Date().toLocaleTimeString('pt-BR') + ' · consulta a cada 3 segundos');
  } catch (e) {
    if (atual !== ciclo) return;
    if (e.status === 401 || e.status === 503) { sair(); mensagem('Chave inválida ou painel desabilitado.'); return; }
    mensagem('Falha de conexão. Nova tentativa em 3 segundos.');
  } finally {
    if (atual === ciclo) { ocupado = false; timer = setTimeout(() => atualizar(atual), 3000); }
  }
}
$('entrar').addEventListener('click', () => {
  const t = $('chave').value.trim();
  if (!/^[a-f0-9]{64}$/.test(t)) { mensagem('Informe uma chave hexadecimal de 64 caracteres.'); return; }
  token = t; $('chave').value = ''; $('entrar').disabled = true; void atualizar(++ciclo);
});
$('sair').addEventListener('click', sair);
