import { useRef } from "react";

export default function useGatilhoTresToques(aoAcionar, quantidade = 3, janelaMs = 1000) {
  const contagem = useRef(0);
  const horarioUltimoToque = useRef(0);

  return function registrarToque() {
    const agora = Date.now();
    const dentroDaJanela = agora - horarioUltimoToque.current <= janelaMs;

    contagem.current = dentroDaJanela ? contagem.current + 1 : 1;
    horarioUltimoToque.current = agora;

    if (contagem.current >= quantidade) {
      contagem.current = 0;
      horarioUltimoToque.current = 0;
      aoAcionar();
    }
  };
}
