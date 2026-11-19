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

// Guarda os ciclos menstruais para o Histórico e o Calendário compartilharem.
// Os dados vêm da API (/api/ciclos) usando a sessão compartilhada; sem sessão, a lista fica vazia.
// Ao sair da conta (logout, Quick Exit ou sessão expirada) a lista é apagada da memória.
export function CiclosProvider({ children }) {
  const sessao = useSessao();
  const [ciclos, setCiclos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimoSalvoId, setUltimoSalvoId] = useState(null);
  const tokenAtual = useRef(null);

  // Só aceita respostas da sessão que as pediu; resposta de sessão antiga é descartada.
  tokenAtual.current = sessao?.token ?? null;

  const recarregar = useCallback(async () => {
    const token = tokenAtual.current;

    if (!token) {
      return;
    }

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
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    setCiclos([]);
    setUltimoSalvoId(null);
    setErro("");
    setCarregando(false);

    if (sessao) {
      recarregar();
    }
  }, [sessao?.token, recarregar]);

  // As três operações devolvem uma Promise e lançam o erro da API, para a tela mostrar o aviso.
  async function cadastrarCiclo(dados) {
    const token = tokenAtual.current;
    const novo = await criarCiclo(dados);

    if (tokenAtual.current === token) {
      setCiclos((listaAtual) => [...listaAtual, novo]);
      setUltimoSalvoId(novo.id_ciclo);
    }

    return novo;
  }

  async function atualizarCiclo(id, dados) {
    const atual = ciclos.find((ciclo) => ciclo.id_ciclo === id);

    if (!atual) {
      return null;
    }

    const token = tokenAtual.current;
    const atualizado = await atualizarCicloApi(id, { ...atual, ...dados });

    if (tokenAtual.current === token) {
      setCiclos((listaAtual) =>
        listaAtual.map((ciclo) => (ciclo.id_ciclo === id ? atualizado : ciclo))
      );
      setUltimoSalvoId(id);
    }

    return atualizado;
  }

  async function excluirCiclo(id) {
    const token = tokenAtual.current;
    await excluirCicloApi(id);

    if (tokenAtual.current === token) {
      setCiclos((listaAtual) => listaAtual.filter((ciclo) => ciclo.id_ciclo !== id));
    }
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
    logado: Boolean(sessao),
    carregando,
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
