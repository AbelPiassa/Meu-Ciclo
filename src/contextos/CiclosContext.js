import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import useSessao from "../hooks/useSessao";
import {
  atualizarCiclo as atualizarCicloApi,
  criarCiclo,
  excluirCiclo as excluirCicloApi,
  listarCiclos,
} from "../services/ciclos.js";
import { textoParaData } from "../utils/datas";

const CiclosContext = createContext(null);

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
// e respostas de requisições feitas por uma sessão antiga são descartadas.
export function CiclosProvider({ children }) {
  const sessao = useSessao();
  const chaveSessao = sessao?.token ?? null;
  const [ciclos, setCiclos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimoSalvoId, setUltimoSalvoId] = useState(null);

  // Refs síncronas: valem na hora, sem esperar a próxima renderização.
  const tokenAtual = useRef(null);
  const carregandoRef = useRef(false);
  const gravandoRef = useRef(false);

  tokenAtual.current = chaveSessao;

  const recarregar = useCallback(async () => {
    const token = tokenAtual.current;

    if (!token) {
      return;
    }

    carregandoRef.current = true;
    setCarregando(true);
    setErro("");

    try {
      const lista = await listarCiclos();

      if (tokenAtual.current === token) {
        setCiclos(lista);
      }
    } catch (falha) {
      if (tokenAtual.current === token) {
        setErro(falha.message || "Não foi possível carregar os registros.");
      }
    } finally {
      if (tokenAtual.current === token) {
        carregandoRef.current = false;
        setCarregando(false);
      }
    }
  }, []);

  // Qualquer mudança de sessão (entrar, sair, Quick Exit, 401, outra conta) zera tudo e recarrega.
  useEffect(() => {
    setCiclos([]);
    setUltimoSalvoId(null);
    setErro("");
    carregandoRef.current = false;
    gravandoRef.current = false;
    setCarregando(false);
    setGravando(false);

    if (chaveSessao) {
      recarregar();
    }
  }, [chaveSessao, recarregar]);

  // Executa uma escrita com as proteções comuns: exige sessão, recusa durante o carregamento,
  // recusa uma segunda operação enquanto outra roda (trava síncrona) e só aplica o resultado
  // se a sessão continuar a mesma.
  async function escrever(operacao, aplicar) {
    const token = tokenAtual.current;

    if (!token) {
      throw erroDeEstado("Entre na sua conta para continuar.", 401);
    }

    if (carregandoRef.current) {
      throw erroDeEstado("Aguarde o carregamento dos registros.");
    }

    if (gravandoRef.current) {
      throw erroDeEstado("Aguarde a operação em andamento.");
    }

    gravandoRef.current = true;
    setGravando(true);

    try {
      const resultado = await operacao();

      if (tokenAtual.current === token) {
        aplicar(resultado);
      }

      return resultado;
    } finally {
      if (tokenAtual.current === token) {
        gravandoRef.current = false;
        setGravando(false);
      }
    }
  }

  // As três operações devolvem uma Promise e lançam o erro, para a tela mostrar o aviso.
  function cadastrarCiclo(dados) {
    return escrever(
      () => criarCiclo(dados),
      (novo) => {
        setCiclos((listaAtual) => [...listaAtual, novo]);
        setUltimoSalvoId(novo.id_ciclo);
      }
    );
  }

  function atualizarCiclo(id, dados) {
    const atual = ciclos.find((ciclo) => ciclo.id_ciclo === id);

    if (!atual) {
      return Promise.reject(erroDeEstado("Registro não encontrado. Atualize a lista."));
    }

    return escrever(
      () => atualizarCicloApi(id, { ...atual, ...dados }),
      (atualizado) => {
        setCiclos((listaAtual) =>
          listaAtual.map((ciclo) => (ciclo.id_ciclo === id ? atualizado : ciclo))
        );
        setUltimoSalvoId(id);
      }
    );
  }

  function excluirCiclo(id) {
    return escrever(
      () => excluirCicloApi(id),
      () => setCiclos((listaAtual) => listaAtual.filter((ciclo) => ciclo.id_ciclo !== id))
    );
  }

  // Do mais recente para o mais antigo
  const ciclosOrdenados = useMemo(
    () =>
      [...ciclos].sort(
        (a, b) => textoParaData(b.data_inicio) - textoParaData(a.data_inicio)
      ),
    [ciclos]
  );

  const valor = {
    ciclos: ciclosOrdenados,
    chaveSessao,
    logado: Boolean(chaveSessao),
    carregando,
    gravando,
    erro,
    ultimoSalvoId,
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
