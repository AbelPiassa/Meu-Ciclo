
# Meu Ciclo+ — Data Science

## 1. Apresentação

Esta etapa do Projeto Integrador Meu Ciclo+ utiliza
Ciência de Dados para analisar informações públicas
sobre notificações de violência contra mulheres no Brasil.

O objetivo é compreender padrões históricos das notificações,
utilizando Python para realizar análise exploratória de dados
(EDA).

## 2. Fonte dos dados

- Instituição: Ministério da Saúde / SVSA
- Sistema: SINAN Net
- Plataforma: DATASUS / TabNet
- Agravo: Violência Interpessoal e Autoprovocada
- Abrangência: Brasil
- Filtro: Sexo feminino
- Período analisado: 2015 a 2024
- Linha: Ano da Notific
- Coluna: Não ativa
- Conteúdo: Frequência
- Unidade de análise: ano de notificação
- Data da nova consulta e conferência: 18/11/2026

### Endereço da consulta

https://tabnet.datasus.gov.br/cgi/deftohtm.exe?sinannet/cnv/violebr.def

O endereço abre o formulário. Para reproduzir a consulta,
é necessário aplicar os filtros descritos acima.

### Arquivos utilizados

- `dados/brutos/sinan_feminino_2015_2024.csv`:
  tabela simplificada utilizada pelo notebook.
- `dados/brutos/sinannet_cnv_violebr211340177_76_178_23.csv`:
  exportação original do TabNet, preservada com cabeçalho,
  total, fonte e notas.

A exportação original foi lida com codificação Latin-1
(ISO-8859-1) e utiliza ponto e vírgula como separador.

### Conferência dos valores

Os dez valores anuais da exportação coincidem com a
tabela utilizada no notebook.

Total no período: 2.775.742 notificações.

Segundo as notas da exportação, os dados de 2024 foram
atualizados em 12/03/2026, e os dados foram disponibilizados
no TabNet em outubro de 2026.

As contagens representam notificações, não necessariamente
pessoas distintas. A ausência de valores vazios na tabela
agregada não comprova a completude dos registros originais.

## 3. Estrutura do projeto

data-science/
- dados/brutos/: dados extraídos do DATASUS
- dados/tratados/: base por UF/ano reproduzida pelo notebook
- notebooks/: análises desenvolvidas em Python
- modelo/: arquivos de modelos futuros
- requirements.txt: dependências
- README.md: documentação

## 4. Análise exploratória

O notebook 01_eda_sinan_meu_ciclo.ipynb realiza:

1. Carregamento dos dados em CSV.
2. Inspeção da estrutura da tabela.
3. Verificação de valores ausentes.
4. Identificação de linhas duplicadas.
5. Conversão das variáveis para formato numérico.
6. Visualização da evolução anual.
7. Interpretação dos resultados e limitações.

## 5. Resultados observados

A tabela analisada contém 10 registros anuais e duas
variáveis: ano e frequencia.

Não foram encontrados valores ausentes ou linhas
duplicadas na tabela agregada.

Em 2015 foram registradas 158.986 notificações.
Em 2024 foram registradas 437.828 notificações.

Observou-se uma tendência geral de crescimento das
notificações, com redução em 2020 e crescimento nos
anos seguintes.

## 6. Limitações

Os números representam notificações registradas no
SINAN, não a totalidade dos episódios de violência.

A tabela é agregada por ano e não permite analisar
características individuais ou estimar risco pessoal.

Mudanças na cobertura e na qualidade das notificações
podem influenciar os resultados.

## 7. Como executar

A partir da pasta data-science, no Linux:

python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pip install ipykernel

Abrir notebooks/01_eda_sinan_meu_ciclo.ipynb no VS Code.

Selecionar o ambiente .venv como kernel e executar
todas as células.

## 8. Próximas etapas

- Ampliar a análise para outras dimensões disponíveis.
- Avaliar a qualidade dos dados.
- Definir uma pergunta adequada para modelagem.
- Implementar e avaliar o primeiro modelo.
- Estudar a integração de indicadores agregados com a API.

Não utilizar os resultados para classificar o risco
individual das usuárias do aplicativo.


## 9. Extensão por UF — consulta de 18/11/2026

Linha: Região/UF de notificação; coluna: Ano da Notific; conteúdo: Frequência; sexo feminino; período 2015–2024. O arquivo `dados/brutos/sinan_feminino_uf_2015_2024_tabnet.txt` é uma cópia textual da página de resultados, incluindo notas, não uma exportação CSV original. O endereço do formulário acima requer reaplicar os filtros.

O notebook preserva a análise nacional e acrescenta extração das 27 UFs, conferência dos totais, transformação para formato longo e gráfico de contagens de 2024. Subtotais regionais e Total não são observações da base tratada.

Saída: `dados/tratados/sinan_feminino_uf_2015_2024.csv` (UTF-8, separador `;`), 270 linhas e três colunas: `uf` (nome completo), `ano` e `frequencia` (contagem). Os dez totais anuais coincidem com a série nacional: 2.775.742 notificações no período. A execução verifica ausências, duplicidade UF/ano, totais por UF e total nacional; não imputa valores. O CSV nacional simplificado também é comparado com a exportação original Latin-1.

As contagens não são taxas populacionais, vítimas únicas ou risco individual. Incluem violência interpessoal e autoprovocada, todas as idades do sexo feminino. UF de notificação não significa UF de residência ou ocorrência. Segundo as notas, o Espírito Santo utiliza e-SUS VS a partir de dezembro de 2019. Licença específica de reutilização ainda não confirmada.

### Reprodução automática

A partir de `data-science/`, com o ambiente ativado e as dependências instaladas:

```bash
python -m jupyter nbconvert --to notebook --execute --inplace notebooks/01_eda_sinan_meu_ciclo.ipynb
```

A execução completa recria o CSV tratado e mantém resultados e gráficos no notebook. Os arquivos brutos devem permanecer intactos. Consulte `VALIDACAO.md` para a conferência executada pelo assistente.

### Responsabilidades e pendências

| Responsável | Atividade |
| --- | --- |
| Abel | Fonte, preparação e EDA; futura API de indicador agregado |
| Lucca | Objetivo e modelo, treinamento, métricas, validação cruzada e exportação |
| Matheus Albertini | Reprodução independente, auditoria da validação e interface do indicador |

Esta atualização conclui a extensão da EDA. Não inclui modelo treinado nem integração no aplicativo. Para as Entregas 3 e 4 ainda é preciso definir classificação e/ou agrupamento conforme o enunciado, executar e avaliar o modelo e integrar o indicador. Uma proposta de regressão exige confirmar adequação com o professor. Não há métricas preditivas a relatar nesta etapa. A validação deve considerar medidas repetidas por UF e ordem temporal; transformações do modelo devem ser ajustadas apenas no treino.
