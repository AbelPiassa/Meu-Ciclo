# Conferência da EDA — 18/11/2026

Execução pelo assistente, não atribuída aos integrantes. Python 3.12, pandas 2.2.3, matplotlib 3.10.8.

- 11 células de código executadas sequencialmente em processo Python novo, com namespace compartilhado; duas figuras e saídas registradas no notebook.
- Kernel Jupyter convencional não iniciou porque o ambiente bloqueia sockets TCP e IPC. A execução utilizou `exec` e captura de `display`, stdout e figuras; não foi uma execução via nbclient. Reprodução independente no Jupyter/VS Code permanece pendente.
- Notebook validado com nbformat.
- Série nacional simplificada confere com os dez registros da exportação Latin-1 original.
- Extração por UF: 27 UFs, dez anos, 270 linhas, nenhuma ausência, nenhuma duplicação UF/ano; contagens não negativas.
- Totais de cada UF conferidos; soma das UFs coincide com os dez totais nacionais e com o Total da consulta UF: 2.775.742.
- CSV regenerado idêntico em conteúdo tabular ao arquivo tratado enviado por Abel.
- Dois gráficos: evolução nacional e contagens por UF em 2024. Sem métricas preditivas ou afirmações de risco individual.
- `npm run lint` e `npm run typecheck` foram tentados na raiz: scripts inexistentes no package.json. Não são apresentados como aprovados. Nenhum código do aplicativo foi alterado.

Os arquivos brutos recebidos foram copiados sem alterar seus bytes. A validação confirma consistência dos arquivos fornecidos, não nova consulta ao portal nem completude epidemiológica. Revisão humana, termos de reutilização, modelagem e integração permanecem pendentes.

## Reprodução independente — Lucca — 18/11/2026

A análise exploratória foi reproduzida integralmente em ambiente Windows, utilizando ambiente virtual Python.

### Ambiente utilizado

- Python 3.13.13
- Pandas 3.1.1
- Matplotlib 3.11.2
- NumPy 2.5.5
- Nbconvert 7.17.2
- IPykernel 7.4.0

### Comando executado

`python -m jupyter nbconvert --to notebook --execute --inplace notebooks/01_eda_sinan_meu_ciclo.ipynb`

### Resultados obtidos

| Indicador | Resultado |
|---|---:|
| Registros | 270 |
| Colunas | 3 |
| Unidades federativas | 27 |
| Anos | 10 |
| Valores nulos | 0 |
| Duplicidades UF/ano | 0 |
| Total de notificações | 2.775.742 |

O notebook foi executado integralmente pelo Jupyter, sem erros impeditivos. Os avisos relacionados ao kernel ZMQ não comprometeram a execução.

A base tratada foi regenerada e apresentou os resultados esperados, confirmando a reprodução independente da EDA.

A validação confirma a consistência dos arquivos disponíveis no repositório, não constituindo uma nova conferência diretamente no portal DATASUS.

A base está tecnicamente disponível para a etapa seguinte de Machine Learning, respeitando suas limitações estatísticas e epidemiológicas.