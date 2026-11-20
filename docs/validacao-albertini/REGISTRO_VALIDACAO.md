# Registro de validação — Matheus Albertini

Projeto Integrador Meu Ciclo+ · Diário de Ocorrências e reprodução/auditoria de Data Science
Base: `master` @ `e0fa3da2e22fb9e758a9362008693cc2e7aea939` · Branch: `feat/albertini-validacao-ds-diario` · Data: 19/11/2026

## Declaração sobre a origem das evidências

As execuções das seções 1 a 3 foram feitas no ambiente Linux do assistente de IA (Claude), a pedido do integrante, e servem como roteiro e verificação preliminar. A reprodução feita pelo Matheus em sua própria máquina (Windows, Python 3.13.7) está registrada na seção 4 e cobre os testes e os notebooks de Data Science. Itens da seção 4 sem resultado não foram executados localmente.

Ambiente do assistente: Linux, Python 3.12.3, scikit-learn 1.9.1, pandas 3.1.1, numpy 2.5.5, Node 24.22.3. Mesmas versões de bibliotecas do ambiente do Lucca (Windows, Python 3.13.13).
Somente dados públicos agregados e contas fictícias (`teste.*`). Logs em `evidencias/`.

## 1. Data Science

| Verificação | Resultado |
|---|---|
| Testes automatizados (`unittest`) | 6/6 aprovados |
| Notebooks 01, 02 e 03 executados com `nbconvert` | sem erros; 2 gráficos PNG em cada um; cópias em `notebooks_executados/` |
| Base: exportação TabNet (Latin-1) = CSV simplificado | idênticos nos 10 anos; total 2.775.742 |
| Base por UF | 270 linhas, 27 UFs, sem nulos nem duplicidade UF/ano; soma das UFs = total nacional em todos os anos |
| Reimplementação independente feita pelo assistente (código próprio, sem usar `ml_sinan.py`) | CV F1 macro RF 0,5625; teste 2024: acurácia 0,4815, F1 macro 0,4167, acurácia balanceada 0,4145, matriz `[[2,6],[8,11]]` |
| Clusterização independente | k=2 → silhouette 0,3607, grupos 22 e 5 |
| JSONs regenerados vs. versionados | métricas idênticas; mudam só metadados (versão do Python, SHA-256) e ruído de ponto flutuante (~1e-15) |

### Achados da auditoria

1. **Métricas confirmadas.** Todos os números do README/MODELAGEM/JSON foram reproduzidos, inclusive por código independente.
2. **O classificador não é melhor que as referências.** No teste de 2024, Random Forest tem acurácia 48,15%, abaixo da referência "maioria" (70,37%). A acurácia balanceada (41,45%) fica abaixo da de "maioria" e "persistência" (50%). O F1 macro (41,67%) é só marginalmente acima de 41,30%. `criterio_atendido = false`. Resultado negativo, corretamente declarado; não apresentar o modelo como previsão.
3. **"Maioria" e "persistência" têm resultado idêntico em 2024** (`[[0,8],[0,19]]`: ambas preveem sempre "aumento"). Servem de referência, mas não são duas referências independentes nesse ano.
4. **Sem vazamento detectado.** Atributos usam apenas t, t-1 e t-2; o alvo é t+1. O teste `test_sem_vazamento` passa. A reimplementação do assistente, com CV expansiva, por ano-alvo reproduziu os números. O teste de 2024 só foi avaliado para o modelo escolhido e as referências.
5. **Seleção de k na clusterização.** k=3 tem silhouette maior (0,4591), mas gera grupos de 3, 22 e 2 UFs e é excluído pela regra "mínimo de 3 UFs por grupo". Silhouettes: k=2 0,3607; k=3 0,4591; k=4 0,3364; k=5 0,3815; k=6 0,3764. O k=2 vem dessa regra metodológica, e o k é escolhido pelo mesmo critério (silhouette) calculado nos mesmos dados, o que é otimista. A divisão 22/5 é desbalanceada.
6. **Estabilidade limitada confirmada.** ARI médio 0,6263, percentil 10 de -0,0562 (algumas subamostras concordam tanto quanto o acaso) e ARI temporal 0,3402. Os grupos são descritivos e não podem virar categoria de risco.
7. **SHA-256 do CSV muda entre sistemas** (`63faf3cd…` no Windows, `d5b8a72f…` no Linux) apenas por quebra de linha CRLF/LF; o conteúdo é o mesmo (conferido). Não é divergência de dados. Sugestão: registrar isso nos metadados ou normalizar a quebra de linha antes do hash.
8. **Limitações já documentadas permanecem válidas:** notificações ≠ pessoas; UF de notificação ≠ UF de residência; sem denominador populacional; 27 UFs × 10 anos; subnotificação; licença do TabNet não confirmada.

### Não verificado

- **Conferência direta no portal TabNet**: não é possível a partir do ambiente do assistente. Segue pendente (o `VALIDACAO.md` do projeto já a lista como pendente).
- A exportação de TabNet traz nota de que dados de 2025 existem, "sujeitos à revisão"; o recorte 2015–2024 os exclui, coerente com a documentação.

## 2. Interface do indicador SINAN (`src/pages/IndicadorSinan.js`)

Revisão do código e do contrato, **sem execução visual** (sem Expo Go, emulador nem navegador neste ambiente).

- Exibe aviso "Apenas para fins acadêmicos" + texto do aviso do JSON, fonte, período, total (2.775.742), nº de UFs/registros, grupos (somente quantidade de UFs e crescimento geométrico médio), silhouette, ARI médio/temporal/p10, "Estabilidade limitada — resultado exploratório" e a lista de limitações. Sem ranking, sem previsão, sem a classificação supervisionada.
- O serviço rejeita JSON sem aviso ou fora do esquema; o backend devolve o arquivo `indicador_agregado.json` e o teste do backend cobre autenticação e ausência de cache.
- Sugestões não bloqueantes: (a) mostrar o campo `status_validacao` ("exploratório; estabilidade limitada; não operacional"), que é validado mas não exibido; (b) rotular o crescimento como "ao ano" (é média anual); (c) deixar visível que o k=2 foi imposto pela regra de grupos mínimos.
- **Pendente (manual):** abrir a tela no Expo Go e conferir que os valores exibidos batem com o JSON.

## 3. Diário de Ocorrências (execução do assistente; reprodução local na seção 4)

| Verificação | Resultado |
|---|---|
| `npm test` (app, Node 24) | 83/83, 0 ignorados (inclui "Diário × API real") |
| `npm test` no backend | 12/12 |
| `lint` e `typecheck` do backend | sem erros |
| Roteiro E2E contra a API real (HTTP, SQLite em arquivo, 2 contas fictícias) | 39/39 (`evidencias/05_diario_e2e_api.txt`) |
| Persistência após logout/login e após reiniciar o servidor | confirmada (4 registros após login; 3 após exclusão e reinício) |

O E2E cobre: cadastro (201 + Location), listagem (mais novo primeiro), busca por ID, edição, exclusão (204, depois 404); validações de data inexistente, 29/02 em ano não bissexto, formato, tipo/descrição vazios, limites 100/5000/200, nível inválido, campo extra, `id_perfil` alheio e tipo booleano; limites exatos aceitos; PUT inválido preservando o registro; 401 sem token/token inválido/token após logout; isolamento (conta B não lê, edita, exclui nem filtra registros da A); respostas `no-store`.

Autenticação e sessão: nenhum arquivo de autenticação/sessão foi alterado.

### Achados

- **Datas futuras:** o app as bloqueia, mas **a API aceita** (POST com 2099-01-01 → 201). Já era pendência declarada; agora há evidência. Ajuste é do backend (Abel); não foi alterado.
- A tela só edita data e descrição; tipo, "como se sentiu", nível de perigo e "acionou polícia" ficam com padrão ou valor preservado no PUT (cobertos por teste).
- **Não testado:** interação real na tela (digitação, modal de exclusão, rolagem) em aparelho/Expo Go; concorrência/Quick Exit só por testes automatizados.

## 4. Execução local

| Item | Comando | Data/hora | Resultado | Observações |
|---|---|---|---|---|
| Testes DS | `python -m unittest discover -s testes -p test_ml_sinan.py -v` | 19/11/2026 22:37 | 6/6 aprovados (OK) | Windows, Python 3.13.7, scikit-learn 1.9.1 |
| Notebook 01/02/03 | `python -m jupyter nbconvert --to notebook --execute <notebook> --output-dir ../docs/validacao-albertini/notebooks_executados` | 19/11/2026 22:37 | Sem erros; 2 gráficos em cada; métricas conferidas | F1 macro CV 0,5625; acurácia teste 0,4815; silhouette 0,3607 |
| `npm test` (raiz) | `npm test` | — | Não executado localmente | Resultado do assistente (Linux, Node 24.22.3): 83/83, ver seção 3. Pendente rodar no Windows com Node 24 |
| Backend | `npm ci` e `npm test` em `backend/` | — | Não executado localmente | Resultado do assistente (Linux, Node 24.22.3): 12/12, lint e typecheck sem erros, ver seção 3 |
| Diário no Expo Go | roteiro de `04_CHECKLIST_EXPO_GO.md` | — | Não executado | Sem tempo hábil antes do prazo |
| Tela do indicador | conferir valores contra `indicador_agregado.json` | — | Não executado | Sem tempo hábil antes do prazo; revisão apenas por leitura do código (seção 2) |

## 5. Impedimentos

- Teste em Expo Go e em aparelho físico: não executado (motivo: sem tempo hábil antes do prazo).
- Reprodução local de `npm test` e do backend (Node 24): não executada; só há o resultado do assistente.
- Conferência direta no TabNet: não feita; segue pendente conforme o VALIDACAO.md do projeto.
- As evidências de `evidencias/` foram geradas no ambiente do assistente (Linux); a reprodução local do Matheus está registrada na seção 4.