# Contrato REST v1 — Meu Ciclo+

Base: `http://127.0.0.1:3000/api`. JSON em todas as requisições com corpo.
Datas: **AAAA-MM-DD**, inclusive na resposta. O app deve converter seu DD/MM/AAAA.
IDs são números gerados pelo banco. Booleanos são JSON `true`/`false`.
PUT substitui os campos editáveis: enviar todos os campos obrigatórios; opcionais omitidos
voltam ao valor padrão. Campos não previstos (inclusive IDs gerados) são rejeitados.
Não enviar diretamente todo o objeto de resposta no PUT; construir o DTO com os campos abaixo.

## Perfil e sessão

`POST /perfis` — sem sessão, limite de 20 tentativas em 15 minutos por IP, compartilhado com login.
Exemplo inteiramente fictício (não reutilizar esta senha fora de demonstrações):

```json
{
  "usuario": "demonstracao.ficticia",
  "senha": "Apenas-demonstracao-123!",
  "nome": "Perfil fictício",
  "telefone_emergencia": "00000000000",
  "modo_disfarce": true,
  "notificacoes": false,
  "tema": "Claro"
}
```

Resposta 201: `{ "perfil": { "id_perfil": 1, "usuario": "...", "nome": "...",
"telefone_emergencia": "...", "modo_disfarce": true, "notificacoes": false, "tema": "Claro" },
"token": "<segredo retornado uma vez>", "expira_em": "<ISO UTC>" }`.
`Location` aponta para o perfil. Nunca há senha ou hash na resposta.

`POST /sessoes`: corpo `{ "usuario": "demonstracao.ficticia", "senha": "Apenas-demonstracao-123!" }`.
Resposta 200: `{ "id_perfil": 1, "token": "...", "expira_em": "..." }`.
Após cadastro/login, enviar `Authorization: Bearer <token>` nas demais chamadas.
`DELETE /sessoes/atual`: revoga a sessão atual e responde 204.

`GET /perfis`: array com apenas o próprio perfil.
`GET /perfis/:id`: objeto do próprio perfil.
`PUT /perfis/:id`: objeto com nome, telefone_emergencia, modo_disfarce, notificacoes e tema.
Não enviar usuario, senha ou id_perfil no PUT; credenciais são imutáveis nesta versão.
`DELETE /perfis/:id`: 204, remove perfil, filhas e todas as sessões associadas.

Campos: usuario entre 3–60 caracteres (letras, números, ponto, sublinhado, hífen),
normalizado em minúsculas; senha entre 12–128 caracteres. Nome até 100, padrão vazio.
Telefone obrigatório com 10 ou 11 dígitos (aceita máscara); valida formato, não existência.
Tema Claro/Escuro; modo_disfarce padrão true, notificacoes padrão false.

## Ciclo, Rede e Diário

Para cada coleção `/ciclos`, `/contatos` e `/ocorrencias`:

| Operação | Resultado |
| --- | --- |
| GET coleção | 200 + array dos registros do perfil da sessão (mais novos por ID primeiro) |
| GET coleção/:id | 200 + objeto; 404 se inexistente ou de outro perfil |
| POST coleção | 201 + objeto com ID e Location |
| PUT coleção/:id | 200 + objeto atualizado |
| DELETE coleção/:id | 204 sem corpo |

Filtragem opcional `?id_perfil=N` só aceita o próprio perfil; nunca substitui autenticação.
Todos os POST/PUT abaixo exigem id_perfil numérico igual ao retornado no cadastro/login.
Não é permitido transferir um registro para outro perfil.

### Ciclos — Kauê integra a tela

```json
{
  "id_perfil": 1,
  "data_inicio": "2026-11-01",
  "data_fim": "2026-11-05",
  "fluxo": "Moderado",
  "humor": "",
  "sintomas": "",
  "observacoes": "Registro fictício"
}
```

Obrigatórios: id_perfil, data_inicio, data_fim, fluxo (Leve/Moderado/Intenso).
Datas reais, início <= fim. Opcionais: humor até 200, sintomas até 500,
observacoes até 1000; padrão vazio. Resposta acrescenta id_ciclo.

### Contatos — Lucca integra a tela

```json
{
  "id_perfil": 1,
  "nome": "Contato fictício",
  "telefone": "00000000000",
  "relacionamento": "Teste",
  "alerta_automatico": false,
  "observacoes": "Não ligar; demonstração"
}
```

Obrigatórios: id_perfil, nome e relacionamento não vazios (até 100), telefone com 10/11 dígitos.
Opcionais: alerta_automatico false, observacoes até 1000, padrão vazio.
Resposta acrescenta id_contato. Esta API não envia alertas ou ligações.

### Ocorrências — Matheus Albertini integra a tela

```json
{
  "id_perfil": 1,
  "data_ocorrencia": "2026-11-01",
  "tipo_ocorrencia": "Teste acadêmico",
  "descricao_relato": "Relato inteiramente fictício.",
  "como_se_sentiu": "",
  "nivel_perigo": "Não informado",
  "acionou_policia": false
}
```

Obrigatórios: id_perfil, data_ocorrencia real, tipo_ocorrencia não vazio até 100,
descricao_relato não vazio até 5000. Opcionais: como_se_sentiu até 200 (vazio),
nivel_perigo Não informado/Baixo/Médio/Alto (Não informado), acionou_policia false.
Resposta acrescenta id_ocorrencia. Nível é declarado pela pessoa, nunca calculado com dados SINAN.

## Erros e integração

Formato: `{ "erro": { "codigo": "VALIDACAO", "mensagem": "Revise os campos.",
"campos": [{ "campo": "data_inicio", "mensagem": "..." }] } }`.
`campos` aparece apenas em erros de validação.

| Status | Significado |
| --- | --- |
| 400 | JSON malformado |
| 401 | Sessão ausente/expirada ou credenciais inválidas |
| 404 | Rota/registro não encontrado, inclusive registro pertencente a outro perfil |
| 409 | Usuário já utilizado |
| 413 | Corpo maior que 32 KB |
| 422 | Dados inválidos, campo extra ou id_perfil diferente da sessão |
| 429 | Limite por IP: 300 requisições/minuto; cadastro/login 20/15 minutos |
| 500 | Erro interno sem SQL, stack ou conteúdo sensível |

O frontend deve tratar 204 sem tentar decodificar JSON, 401 encerrando sessão,
falhas de rede sem informar sucesso e estados de carregamento/vazio. O limite por IP
é destinado a laboratório; redes compartilhadas e operação real exigem avaliação própria.
O backend não usa proxy confiável por padrão.

A Quick Exit deve voltar imediatamente à fachada, sem esperar requisição HTTP.
É diferente de excluir Perfil. A equipe deve definir a política de bloqueio/sessão na volta.
Não há mudanças de navegação neste backend.

## Seed manual e teste rápido

1. Fazer POST /perfis com o exemplo fictício; guardar token apenas na sessão de teste.
2. Usar o id_perfil recebido nos três exemplos acima e enviar os POSTs com Bearer.
3. Exercitar GET coleção/ID, PUT com DTO válido e DELETE por ID em cada recurso.
4. Reiniciar o servidor antes dos DELETEs e verificar que os registros continuam.
5. Excluir Perfil apenas ao terminar: os filhos serão excluídos em cascata.
6. Limpar credenciais do cliente de teste. Não publicar capturas com token ou senha.

Para validação reproduzível dos 20 endpoints, usar `npm test`; a suíte já executa o seed
fictício automaticamente em banco isolado e remove seus arquivos temporários.

## Indicador acadêmico SINAN

`GET /api/indicadores/sinan` — Bearer token obrigatório. Retorna o JSON agregado versionado em `data-science/saidas/indicador_agregado.json`, sem consultar perfis ou executar modelos. HTTP 200 (resultado), 401 (sessão inválida/ausente), 503 (arquivo indisponível ou inválido). A implantação deve incluir a pasta `data-science/saidas/`. Não é indicador individual, previsão ou classificação de risco.

## SOS e painel acadêmico

`POST /api/sos`: sessão de usuária obrigatória, conta fictícia `teste.*`, corpo `{latitude, longitude, origem}` (`simulada` ou `dispositivo_teste`), resposta 201 com ID, data UTC e status inicial Novo. 401 sem sessão, 403 se não for conta de teste, 422 para corpo inválido, 503 se a demonstração estiver desabilitada. O ID de perfil vem da sessão. O painel usa `GET /painel/api/alertas` e `PUT /painel/api/alertas/:id` com chave de operador distinta, configurada por `PAINEL_TOKEN` (64 caracteres hexadecimais). PUT recebe `{status}` (Novo, Em atendimento, Concluído). O HTML em `/painel` não contém a chave nem dados. Nenhuma autoridade é acionada.
