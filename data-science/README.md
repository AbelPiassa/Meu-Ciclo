
# Meu Ciclo+ — Data Science

## 1. Apresentação

Esta etapa do Projeto Integrador Meu Ciclo+ utiliza
Ciência de Dados para analisar informações públicas
sobre notificações de violência contra mulheres no Brasil.

O objetivo é compreender padrões históricos das notificações,
utilizando Python para realizar análise exploratória de dados
(EDA).

## 2. Fonte dos dados

- Instituição: Ministério da Saúde
- Sistema: SINAN
- Plataforma: DATASUS / TabNet
- Agravo: Violência Interpessoal e Autoprovocada
- Abrangência: Brasil
- Filtro: Sexo feminino
- Período analisado: 2015 a 2024
- Conteúdo: Frequência por ano de notificação
- Unidade de análise: ano de notificação
- Data da consulta: preencher 16/10/2026

Fonte:
https://datasus.saude.gov.br/acesso-a-informacao/doencas-e-agravos-de-notificacao-de-2007-em-diante-sinan/

## 3. Estrutura do projeto

data-science/
- dados/brutos/: dados extraídos do DATASUS
- dados/tratados/: futuras versões tratadas
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
