# Validação final — Entregas 3 e 4 (19/11/2026)

**Status: auditoria documental e de código; não equivale a homologação completa.**

- Fonte do código: `master` em `e0fa3da2e22fb9e758a9362008693cc2e7aea939`.
- Fonte dos requisitos: PDFs `Projeto_Integrador_2S2026.pdf` e `Visualizar tarefa 3 e 4.pdf` do pacote de finalização da equipe.
- Prazo apresentado na tarefa: 19/11/2026, 23h59; apresentação: 23/11/2026.
- Os PRs #6 a #15 foram identificados como incorporados ao repositório.
- Registro realizado com apoio do ChatGPT, sob coordenação de Abel. Nenhum resultado de testes foi atribuído a quem não executou.

## Código conferido na auditoria

| Critério | Evidência de código | Status |
|---|---|---|
| API REST / SQLite | `backend/src/app.js`, `database.js`, `schema.sql` | Implementado; teste no HEAD final pendente |
| Migração SOS | `backend/src/migration-2.sql`, `database.js` | Implementada; teste no HEAD final pendente |
| Sessões e quatro CRUDs | `src/services/` e telas `src/pages/` | Implementados; teste integrado completo pendente |
| SOS e painel | `backend/src/sos.js`, `backend/painel/`, `src/pages/SosDemo.js` | Implementados; teste físico e visual pendente |
| Indicador histórico | `data-science/saidas/indicador_agregado.json` e `src/pages/IndicadorSinan.js` | Implementado com aviso; teste no aparelho pendente |
| Canais 180/190 | `src/pages/CanaisDeAjuda.js` | Correção proposta nesta branch; teste no aparelho pendente |
| DER | `docs/der/DER_SQLITE.md` | Criado nesta branch com base no SQL v1/v2 |

## Data Science — constatação, não nova reprodução

Os notebooks `01_eda_sinan_meu_ciclo.ipynb`, `02_classificacao_sinan.ipynb` e `03_clusterizacao_sinan.ipynb` existem no GitHub e possuem células executadas e outputs. A auditoria conferiu a estrutura serializada dos arquivos, **não** executou o Jupyter novamente.

Os arquivos de resultados registram 27 UFs, 270 pares UF/ano (2015–2024), total de 2.775.742 notificações. A classificação Random Forest obteve F1 macro de 0,4167 no teste de 2024 e **não atingiu** os critérios preditivos previstos. A clusterização K-Means possui k=2, silhouette de aproximadamente 0,3607 e estabilidade limitada. O app exibe indicador histórico agregado, **não** risco individual ou previsão clínica.

Reprodução independente pelo Albertini: **não verificada nesta auditoria**. Se Abel executar os notebooks, registrar o ambiente, data, comandos, outputs e autoria da execução.

## Execuções ainda necessárias no HEAD final

Na raiz, com Node.js 24 e dependências instaladas:

```bash
npm ci
npm ci --prefix backend
npm test
npm test --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npx expo-doctor
npx expo export --platform web --clear
```

Para Data Science em ambiente Python compatível, na pasta `data-science`:

```bash
python -m pip install -r requirements-ml.txt
python -m unittest discover -s testes -p test_ml_sinan.py -v
python -m jupyter nbconvert --to notebook --execute --inplace notebooks/02_classificacao_sinan.ipynb
python -m jupyter nbconvert --to notebook --execute --inplace notebooks/03_clusterizacao_sinan.ipynb
```

Esses comandos **não foram executados por esta auditoria no checkout remoto completo**; a conexão GitHub disponível não executa o código no ambiente do repositório. Registrar saída real antes de marcar aprovação.

## Checklist de demonstração física

- [ ] Expo Go carrega o commit integrado; API responde `/health` no celular pela rede local
- [ ] CRUDs Perfil, Ciclos, Rede de Apoio, Diário: criar/ler/editar/excluir com dados fictícios
- [ ] Conta B não enxerga dados da conta A; logout e Quick Exit eliminam dados visíveis
- [ ] Disfarce e botão Voltar não expõem área protegida
- [ ] Indicador SINAN aparece com aviso acadêmico e sem risco individual
- [ ] 180 e 190 apenas preenchem o discador; não efetuar chamada
- [ ] SOS de `teste.*` com coordenadas simuladas gera alerta; Quick Exit não gera alerta
- [ ] Painel com `PAINEL_TOKEN` local: consulta, atualização automática e status
- [ ] Dados persistem depois de reiniciar a API

## Segurança e apresentação

Não colocar `.env`, `PAINEL_TOKEN`, senhas, tokens, banco SQLite local, coordenadas ou relatos reais em PR, prints ou ZIP. Nunca acionar serviços de emergência no teste. O SOS é exclusivamente acadêmico, sem envio real.

## Entrega Blackboard — conferência final

- [ ] Responsável com acesso definido (Abel ou Cauê)
- [ ] `master` atualizada após revisão e merge dos PRs
- [ ] GitHub atualizado; link e SHA final registrados
- [ ] ZIP do aplicativo (sem `node_modules`, `.env`, bases locais)
- [ ] `USO_IA.md` anexado
- [ ] Kanban exportado para PDF ou imagem
- [ ] `.ipynb` executados com outputs e cópia anexada
- [ ] Nome da equipe, participantes e link da base SINAN no formulário
- [ ] Comprovante real de envio preservado; não presumir envio

**Pendência de produto:** a opção de tema em Perfil é exibida como texto sem seletor e o próprio app informa que tema/lembretes ainda dependem de integração. Não afirmar essas funções como completas.

## Validação automatizada de finalização — 19/11/2026

GitHub Actions: `.github/workflows/validacao-entrega.yml` foi adicionado à branch de fechamento para executar testes de frontend, backend/SOS, lint/typecheck, Expo Doctor, exportação Web e reprodução automática dos notebooks SINAN. A primeira execução constatou falha do Expo Doctor (19/21 verificações): `expo-font` ausente e Expo em patch anterior ao esperado. Um patch mínimo para o **mesmo SDK 57** foi aplicado no `package.json` e `package-lock.json` da branch; sua aprovação depende de nova execução completa no SHA atualizado.

O job de Data Science da primeira rodada concluiu com sucesso e gerou artefato com três notebooks executados. Não confundir execução automatizada com validação pessoal de Albertini.

A geração de ZIP do projeto somente é tratada como validada após passar a etapa correspondente no workflow. O teste em Expo Go e o envio ao Blackboard continuam exigindo execução humana.
