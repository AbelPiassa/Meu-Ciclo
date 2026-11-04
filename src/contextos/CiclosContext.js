import { createContext, useContext, useMemo, useState } from "react";
import { ciclosFicticios } from "../dados/dadosFicticios";
import { textoParaData } from "../utils/datas";

const CiclosContext = createContext(null);

// Guarda os ciclos menstruais para o Histórico e o Calendário compartilharem.
// Por enquanto os dados são locais; na integração com a API, é aqui que as chamadas entram.
export function CiclosProvider({ children }) {
  const [ciclos, setCiclos] = useState(ciclosFicticios);
  const [ultimoSalvoId, setUltimoSalvoId] = useState(null);

  function cadastrarCiclo(dados) {
    const novo = {
      id_ciclo: Date.now(),
      id_perfil: 1,
      humor: "",
      sintomas: "",
      observacoes: "",
      ...dados,
    };

    setCiclos((listaAtual) => [...listaAtual, novo]);
    setUltimoSalvoId(novo.id_ciclo);
    return novo;
  }

  function atualizarCiclo(id, dados) {
    const atual = ciclos.find((ciclo) => ciclo.id_ciclo === id);

    if (!atual) {
      return null;
    }

    const atualizado = { ...atual, ...dados };

    setCiclos((listaAtual) =>
      listaAtual.map((ciclo) => (ciclo.id_ciclo === id ? atualizado : ciclo))
    );
    setUltimoSalvoId(id);
    return atualizado;
  }

  function excluirCiclo(id) {
    setCiclos((listaAtual) => listaAtual.filter((ciclo) => ciclo.id_ciclo !== id));
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
    ultimoSalvoId,
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
