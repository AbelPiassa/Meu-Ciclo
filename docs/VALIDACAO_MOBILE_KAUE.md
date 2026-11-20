# Validação mobile — Kauê (Entrega Final)

Branch: `final/kaue-mobile`, a partir do `master` em `e0fa3da` (PR #15). Dados exclusivamente fictícios. Nenhuma ligação real é feita para 180/190: o app apenas abre o discador.

## Alteração de código desta branch
- `src/pages/CanaisDeAjuda.js`: os cartões Ligue 180 e Ligue 190 abrem o discador (`tel:180` / `tel:190`); se o aparelho não abrir, aparece aviso para discar manualmente. Os cartões da rede local continuam apenas informativos (dados a confirmar).
- `src/utils/canaisAjuda.js`: só 180 e 190 geram endereço de discagem.
- `tests/canais-ajuda.test.mjs`: 2 testes.

## Testes automáticos (executados em 19/11/2026)
| Comando | Resultado |
|---|---|
| `npm test` (raiz) em `e0fa3da` | 83 aprovados, 0 falhas |
| `npm test` (raiz) com a alteração | 85 aprovados, 0 falhas |
| `npm test --prefix backend` | 12 aprovados, 0 falhas |
| `npm run lint --prefix backend` | sem erros |
| `npm run typecheck --prefix backend` | sem erros |
| `npx expo export --platform web --clear` | exportação concluída |

Não executados ainda: `npx expo-doctor`.

## Validação em aparelho físico (Expo Go) — casos EG-01 a EG-23
Aparelho / Android ou iOS / versão do Expo Go / SHA testado: _preencher na execução_.

Todos os casos estão **Não executados** até a execução no aparelho. A cada caso executado, registrar Aprovado ou Reprovado e a evidência (print sem dados pessoais).
