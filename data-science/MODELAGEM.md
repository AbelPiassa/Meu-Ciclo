# Machine Learning — Meu Ciclo+

Responsável pela modelagem: Lucca. Abel: EDA e futura integração via API. Albertini: reprodução independente, auditoria e interface do indicador. Base da EDA: PR #12. Uso de IA: ChatGPT auxiliou desenho, código e testes; Lucca deve executar, revisar e registrar resultados próprios em USO_IA.md.

## Questões estudadas

1. Classificação: caracterizar se as notificações de uma UF aumentam no ano seguinte. Classe 0 = sem aumento; classe 1 = aumento. Trata-se de exercício retrospectivo, não um serviço de previsão clínica ou risco. A cada ano t, três atributos calculados somente com t, t-1 e t-2: log da razão anual, média de duas razões logarítmicas, desvio padrão populacional dessas duas razões. Não inclui UF como preditor, tamanho populacional ou dados pessoais.
2. Clusterização: descrever padrões de crescimento histórico por UF (uma observação por UF, 27 no total). Atributos: média e desvio padrão das nove variações anuais em log, proporção de anos sem aumento. StandardScaler e KMeans com semente 42 e 30 inicializações; comparar k=2..6, escolher maior Silhouette entre soluções com pelo menos três UFs por grupo. O limite é uma decisão metodológica para reduzir grupos muito pequenos, não uma descoberta científica. IDs dos grupos são arbitrários.

## Validação

Classificação: 189 observações UF/ano-alvo (2018–2024). Desenvolvimento 162, teste reservado 27 (2024). CV temporal expansiva, anos-alvo de validação 2020, 2021, 2022, 2023; cada dobra contém todas as UFs do ano. Sem embaralhamento; escalonamento ajustado no treino, apenas para regressão logística. Comparar regressão logística balanceada, árvore e floresta com profundidade limitada, versus maioria do treino e persistência da direção anterior. Selecionar pelo F1 macro das previsões de CV agregadas; avaliar somente o escolhido e referências em 2024. Reportar acurácia, precisão/recall/F1 macro, F1 de cada classe, acurácia balanceada quando ambas as classes ocorrem, matriz de confusão 0/1. 2023 tem somente aumentos; métricas macro usam sempre os dois rótulos e zero_division=0; acurácia balanceada não é calculada nessa dobra. As mesmas UFs aparecem em vários anos; isso é avaliação temporal, não independência entre estados. O período inclui pandemia e mudanças de cobertura. Critério exploratório: F1 macro superior às duas referências em CV e teste, acurácia balanceada teste >=0,60. Não reajustar parâmetros após ver o teste. Independentemente do resultado, não exportar previsões para a interface.

Clusterização: Silhouette, Davies-Bouldin, inércia e tamanhos. Estabilidade por 50 subamostras de 80% das UFs, novo ajuste de scaler e KMeans em cada amostra e comparação por Adjusted Rand Index (ARI) das atribuições das 27 UFs. Sensibilidade temporal: ajustar novamente no período 2015–2023 e comparar com 2015–2024. Não confundir esses diagnósticos com validação cruzada supervisionada nem interpretar grupos como categorias de risco. Indicador exploratório, com estabilidade e limitações visíveis.

## Executar

A partir de data-science, no ambiente virtual ativo:

```cmd
python -m pip install -r requirements-ml.txt
python -m unittest discover -s testes -p test_ml_sinan.py -v
python -m jupyter nbconvert --to notebook --execute --inplace notebooks/02_classificacao_sinan.ipynb
python -m jupyter nbconvert --to notebook --execute --inplace notebooks/03_clusterizacao_sinan.ipynb
```

Alternativa sem notebook: `python modelo/ml_sinan.py`. Os notebooks chamam o mesmo módulo auditável e exibem tabelas e gráficos. O conjunto de testes usa dados agregados já versionados, sem dados fictícios apresentados como reais.

## Saídas

- `saidas/metricas_classificacao.json`: métricas completas e dobras; `avaliacao_classificacao_2024.csv`: avaliação retrospectiva, não fornecer ao aplicativo.
- `saidas/metricas_clusterizacao.json` e `clusters_uf.csv`: critérios, estabilidade e grupos.
- `saidas/indicador_agregado.json`: contrato proposto ao Abel e Albertini, somente análise histórica agregada e aviso. Exibir na área protegida, sem ranking, sem implicar risco ou recomendação e com indicação de baixa estabilidade. Ainda falta integrar e validar na aplicação. Não prometer previsão.
- `modelo/classificacao.joblib` e `modelo/clusterizacao.joblib`: pipelines ajustados, para reprodução acadêmica; carregue apenas artefatos confiáveis gerados pelo próprio projeto, com as mesmas versões. Não carregar no app nem na API.

## Limitações

Dados públicos fornecidos pelo grupo, com consistência/reprodução confirmadas; nova conferência direta no portal e licença específica pendentes. SINAN: notificações de violência interpessoal/autoprovocada, sexo feminino, todas as idades; UF de notificação, não necessariamente residência/ocorrência. Não são vítimas únicas, incidência, prevalência ou risco individual. Subnotificação, mudanças de cobertura/registro e ausência de população denominadora limitam inferências. 27 UFs e 10 anos não sustentam alegações de generalização ampla. Não usar informações do diário, perfil ou contatos. Não substituir avaliação profissional, policial ou jurídica.
