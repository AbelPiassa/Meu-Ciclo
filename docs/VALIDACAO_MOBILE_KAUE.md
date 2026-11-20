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

## Validação em aparelho físico — 19/11/2026
**Ambiente real:** iPhone, navegador **Safari**, app em **Expo Web** (`http://192.168.3.2:8081`) falando com a API local (`http://192.168.3.2:3000`) pela rede Wi-Fi. Código testado: branch `final/kaue-mobile` (base `e0fa3da` + `ab102a0`).

**Não foi Expo Go.** O Expo Go da App Store (SDK 58) não abre este projeto (SDK 57) e uma development build para iPhone exige conta Apple paga. Portanto os casos abaixo valem como teste em aparelho físico pelo navegador, e não como teste do app nativo no Expo Go.

Modelo do aparelho e versão do iOS: _preencher_. Resultados informados pelo integrante; prints: _anexar_.

| ID | Caso | Resultado | Observação |
|---|---|---|---|
| EG-01 | Abrir aplicativo | Aprovado | Abre na fachada (Calendário) |
| EG-02 | Navegar abas | Aprovado | |
| EG-03 | Gatilho de três toques | Aprovado | |
| EG-04 | Quick Exit | Aprovado | |
| EG-05 | Voltar após Quick Exit | Aprovado | |
| EG-06 | Criar conta fictícia | Aprovado | Conta `teste.kaue1` gravada no SQLite (conferido no banco) |
| EG-08 | Ciclos CRUD | Aprovado | Criar, editar, excluir |
| EG-09 | Calendário/Histórico | Aprovado | |
| EG-15 | Persistência após logout/login | Aprovado | |
| EG-17 | Ligue 180 | Aprovado | Abre a confirmação de ligação; cancelado, sem ligar |
| EG-18 | Ligue 190 | Aprovado | Abre a confirmação de ligação; cancelado, sem ligar |
| EG-07 | Perfil: carregar, editar, salvar e reabrir | Aprovado | |
| EG-10 | Rede de Apoio CRUD | Aprovado | |
| EG-11 | Rede de Apoio: máscara e limite de telefone | Aprovado | |
| EG-12 | Diário CRUD | Aprovado | |
| EG-13 | Diário: validação de data e descrição | Aprovado | |
| EG-14 | Isolamento entre contas | Aprovado | |
| EG-16 | Indicador SINAN | Aprovado | |
| EG-19 a EG-23 | SOS, painel, status, Quick Exit sem SOS, reinício da API | Não executado | Responsabilidade do Abel na matriz; não informado como executado |

### Ocorrência durante o teste
Na primeira tentativa de cadastro apareceu "Não foi possível conectar à API ou o tempo de espera terminou". A API estava acessível pelo iPhone (`/health` ok) e uma requisição equivalente feita pelo navegador do PC funcionou. Na nova tentativa o cadastro funcionou. A causa mais provável é a página carregada antes de a API ser reiniciada com a origem do celular liberada em `CORS_ORIGINS`. Não houve alteração de código.
