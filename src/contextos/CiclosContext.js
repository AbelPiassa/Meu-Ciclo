import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import useSessao from "../hooks/useSessao";
import {
  atualizarCiclo as atualizarCicloApi,
  criarCiclo,
  excluirCiclo as excluirCicloApi,
  listarCiclos,
} from "../services/ciclos.js";
import { obterSessao } from "../services/sessao.js";
import { textoParaData } from "../utils/datas";

const CiclosContext = createContext(null);

// Estado vazio, sem dono. Tudo que a tela recebe vem de um estado cujo "token" é o da sessão atual;
// se o dono for outro, a tela recebe este estado vazio (nunca registros da sessão anterior).
const ESTADO_VAZIO = {
  token: null,
  lista: [],
  carregando: false,
  gravando: false,
  erro: "",
  ultimoSalvoId: null,
};

// Fonte única da verdade sobre "qual é a sessão agora": o serviço compartilhado, não um valor de render.
function tokenVigente() {
  return obterSessao()?.token ?? null;
}

function erroDeEstado(mensagem, status) {
  const erro = new Error(mensagem);

  if (status) {
    erro.status = status;
  }

  return erro;
}

// Guarda os ciclos menstruais para o Histórico e o Calendário compartilharem.
// Os dados vêm da API (/api/ciclos) usando a sessão compartilhada; sem sessão, a lista fica vazia.
// Ao sair da conta (logout, Quick Exit, sessão expirada ou troca de perfil) a lista é apagada da memória,
// respostas de requisições feitas por uma sessão antiga são descartadas (comparando com obterSessao())
// e os registros de outra sessão nunca chegam a ser renderizados.
export function CiclosProvider({ children }) {
  const sessao = useSessao();
  const chaveSessao = sessao?.token ?? null;
  const [estado, setEstado] = useState(ESTADO_VAZIO);

  // Refs síncronas marcadas com o dono (token): valem na hora e nunca valem para outra sessão.
  const recargaRef = useRef(null); // { token, promessa } enquanto uma listagem está em andamento
  const gravandoRef = useRef(null); // token da sessão que tem uma escrita em andamento

  // Aplica uma mudança somente se a sessão ainda for a de quem pediu (compara com obterSessao()).
  const aplicar = useCallback((token, mudar) => {
    if (tokenVigente() !== token) {
      return false;
    }

    setEstado((anterior) => {
      const base = anterior.token === token ? anterior : { ...ESTADO_VAZIO, token };
      return { ...base, ...mudar(base) };
    });

    return true;
  }, []);

  // Uma única listagem por sessão: se já há uma em andamento, devolve a mesma promessa.
  const recarregar = useCallback(() => {
    const token = tokenVigente();

    if (!token) {
      return Promise.resolve();
    }

    if (recargaRef.current?.token === token) {
      return recargaRef.current.promessa;
    }

    aplicar(token, () => ({ carregando: true, erro: "" }));

    const promessa = (async () => {
      try {
        const lista = await listarCiclos();
        aplicar(token, () => ({ lista }));
      } catch (falha) {
        aplicar(token, () => ({
          erro: falha.message || "Não foi possível carregar os registros.",
        }));
      } finally {
        if (recargaRef.current?.promessa === promessa) {
          recargaRef.current = null;
        }

        aplicar(token, () => ({ carregando: false }));
      }
    })();

    recargaRef.current = { token, promessa };
    return promessa;
  }, [aplicar]);

  // Qualquer mudança de sessão (entrar, sair, Quick Exit, 401, outra conta): apaga da memória o que era
  // de outra sessão e carrega os registros da nova.
  useEffect(() => {
    setEstado((anterior) =>
      anterior.token !== null && anterior.token !== chaveSessao ? ESTADO_VAZIO : anterior
    );

    if (chaveSessao) {
      recarregar();
    }
  }, [chaveSessao, recarregar]);

  // O que a tela recebe: só o estado da sessão atual. Enquanto a primeira carga não começa, "carregando".
  const atual = chaveSessao !== null && estado.token === chaveSessao ? estado : ESTADO_VAZIO;
  const carregando = chaveSessao !== null && (atual.token === null || atual.carregando);

  // Executa uma escrita com as proteções comuns: exige sessão, recusa durante o carregamento,
  // recusa uma segunda operação enquanto outra roda (trava síncrona) e só aplica o resultado
  // se a sessão continuar a mesma.
  async function escrever(operacao, mudar) {
    const token = tokenVigente();

    if (!token) {
      throw erroDeEstado("Entre na sua conta para continuar.", 401);
    }

    if (recargaRef.current?.token === token) {
      throw erroDeEstado("Aguarde o carregamento dos registros.");
    }

    if (gravandoRef.current === token) {
      throw erroDeEstado("Aguarde a operação em andamento.");
    }

    gravandoRef.current = token;
    aplicar(token, () => ({ gravando: true }));

    try {
      const resultado = await operacao();
      aplicar(token, (base) => mudar(resultado, base));
      return resultado;
    } finally {
      if (gravandoRef.current === token) {
        gravandoRef.current = null;
      }

      aplicar(token, () => ({ gravando: false }));
    }
  }

  // As três operações devolvem uma Promise e lançam o erro, para a tela mostrar o aviso.
  function cadastrarCiclo(dados) {
    return escrever(
      () => criarCiclo(dados),
      (novo, base) => ({ lista: [...base.lista, novo], ultimoSalvoId: novo.id_ciclo })
    );
  }

  function atualizarCiclo(id, dados) {
    const existente = atual.lista.find((ciclo) => ciclo.id_ciclo === id);

    if (!existente) {
      return Promise.reject(erroDeEstado("Registro não encontrado. Atualize a lista."));
    }

    return escrever(
      () => atualizarCicloApi(id, { ...existente, ...dados }),
      (atualizado, base) => ({
        lista: base.lista.map((ciclo) => (ciclo.id_ciclo === id ? atualizado : ciclo)),
        ultimoSalvoId: id,
      })
    );
  }

  function excluirCiclo(id) {
    return escrever(
      () => excluirCicloApi(id),
      (_resultado, base) => ({ lista: base.lista.filter((ciclo) => ciclo.id_ciclo !== id) })
    );
  }

  // Do mais recente para o mais antigo
  const ciclosOrdenados = useMemo(
    () =>
      [...atual.lista].sort(
        (a, b) => textoParaData(b.data_inicio) - textoParaData(a.data_inicio)
      ),
    [atual.lista]
  );

  const valor = {
    ciclos: ciclosOrdenados,
    chaveSessao,
    logado: chaveSessao !== null,
    carregando,
    gravando: atual.gravando,
    erro: atual.erro,
    ultimoSalvoId: atual.ultimoSalvoId,
    recarregar,
    cadastrarCiclo,
    atualizarCiclo,
    excluirCiclo,
  };

  return <CiclosContext.Provider value={valor}>{children}</CiclosContext.Provider>;
}

export function useCiclos() {
  const contexto = useContext(CiclosContext);

  if (contexto === null) {
    throw new Error("useCiclos deve ser usado dentro de CiclosProvider");
  }

  return contexto;
}
