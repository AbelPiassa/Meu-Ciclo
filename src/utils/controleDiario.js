const ESTADO_INICIAL = Object.freeze({
  carregando: false,
  gravando: false,
  listaPronta: false,
  resultadoIncerto: false,
});

function erroSessaoAlterada() {
  const erro = new Error("Sessão alterada. Entre novamente.");
  erro.status = 401;
  return erro;
}

function erroDiarioBloqueado() {
  const erro = new Error("O Diário está aguardando uma operação anterior.");
  erro.codigo = "DIARIO_BLOQUEADO";
  erro.status = 409;
  return erro;
}

function erroOperacaoInvalida(nome) {
  return new TypeError(`${nome} deve ser uma função.`);
}

function possuiStatusNumerico(erro) {
  return typeof erro?.status === "number" && Number.isFinite(erro.status);
}

/**
 * Classifica uma falha de gravação que deixa o estado do servidor desconhecido.
 * Erros HTTP conhecidos abaixo de 500 permitem correção/repetição; falhas de
 * rede, timeouts e respostas 5xx exigem uma nova leitura explícita.
 */
export function classificarGravacaoIncerta(erro) {
  if (!possuiStatusNumerico(erro)) return true;
  if (erro.status < 100 || erro.status > 599) return true;
  if (erro.status >= 500) return true;

  const codigo = typeof erro.code === "string" ? erro.code.toUpperCase() : "";
  const nome = typeof erro.name === "string" ? erro.name : "";
  const mensagem = typeof erro.message === "string" ? erro.message : "";
  const timeoutExplicito =
    erro.timeout === true ||
    ["ETIMEDOUT", "ECONNABORTED", "ERR_TIMEOUT", "TIMEOUT", "ABORT_ERR"].includes(codigo) ||
    /timeout|timed\s*out|tempo\s*(?:limite|esgotado)/i.test(`${nome} ${mensagem}`) ||
    /timeout/i.test(codigo);

  return timeoutExplicito;
}

function mesmoEstado(a, b) {
  return (
    a.carregando === b.carregando &&
    a.gravando === b.gravando &&
    a.listaPronta === b.listaPronta &&
    a.resultadoIncerto === b.resultadoIncerto
  );
}

/**
 * Coordena a leitura e a gravação do Diário para uma única identidade de
 * sessão. Não conhece UI, rede ou timers: loader e writer são injetados.
 */
export function criarControleDiario({ sessao, sessaoAtual }) {
  if (typeof sessaoAtual !== "function") {
    throw new TypeError("sessaoAtual deve ser uma função.");
  }

  let estado = ESTADO_INICIAL;
  const ouvintes = new Set();
  let ticketCarregamento = null;
  let promessaCarregamento = null;
  let ticketGravacao = null;
  let promessaGravacao = null;

  function obterEstado() {
    return estado;
  }

  function notificar() {
    for (const ouvinte of ouvintes) ouvinte(estado);
  }

  function atualizar(mudancas) {
    const proximo = {
      carregando: mudancas.carregando ?? estado.carregando,
      gravando: mudancas.gravando ?? estado.gravando,
      listaPronta: mudancas.listaPronta ?? estado.listaPronta,
      resultadoIncerto: mudancas.resultadoIncerto ?? estado.resultadoIncerto,
    };

    if (mesmoEstado(estado, proximo)) return;
    estado = Object.freeze(proximo);
    notificar();
  }

  function observar(listener) {
    if (typeof listener !== "function") throw new TypeError("listener deve ser uma função.");
    ouvintes.add(listener);
    return () => ouvintes.delete(listener);
  }

  function sessaoValida() {
    return sessao !== null && sessao !== undefined && sessaoAtual() === sessao;
  }

  function exigirSessao() {
    if (!sessaoValida()) throw erroSessaoAlterada();
  }

  function carregar(loader) {
    if (promessaCarregamento) return promessaCarregamento;
    if (typeof loader !== "function") return Promise.reject(erroOperacaoInvalida("loader"));
    if (ticketGravacao) return Promise.reject(erroDiarioBloqueado());

    if (!sessaoValida()) return Promise.reject(erroSessaoAlterada());

    const ticket = {};
    ticketCarregamento = ticket;
    atualizar({ carregando: true, listaPronta: false });

    const promessa = Promise.resolve()
      .then(() => {
        exigirSessao();
        return loader();
      })
      .then((valor) => {
        exigirSessao();
        if (ticketCarregamento === ticket) {
          atualizar({ carregando: true, listaPronta: true, resultadoIncerto: false });
        }
        return valor;
      })
      .catch((erro) => {
        if (ticketCarregamento === ticket) {
          atualizar({ listaPronta: false });
        }
        throw erro;
      })
      .finally(() => {
        if (ticketCarregamento !== ticket) return;
        ticketCarregamento = null;
        promessaCarregamento = null;
        atualizar({ carregando: false });
      });

    promessaCarregamento = promessa;
    return promessa;
  }

  function gravar(writer) {
    if (typeof writer !== "function") return Promise.reject(erroOperacaoInvalida("writer"));
    if (ticketCarregamento || ticketGravacao || !estado.listaPronta || estado.resultadoIncerto) {
      return Promise.reject(erroDiarioBloqueado());
    }

    if (!sessaoValida()) return Promise.reject(erroSessaoAlterada());

    const ticket = {};
    ticketGravacao = ticket;
    atualizar({ gravando: true });

    const promessa = Promise.resolve()
      .then(() => {
        exigirSessao();
        return writer();
      })
      .then((valor) => {
        exigirSessao();
        return valor;
      })
      .catch((erro) => {
        if (ticketGravacao === ticket && classificarGravacaoIncerta(erro)) {
          atualizar({ listaPronta: false, resultadoIncerto: true });
        }
        throw erro;
      })
      .finally(() => {
        if (ticketGravacao !== ticket) return;
        ticketGravacao = null;
        promessaGravacao = null;
        atualizar({ gravando: false });
      });

    promessaGravacao = promessa;
    return promessa;
  }

  return Object.freeze({ obterEstado, observar, carregar, gravar });
}
