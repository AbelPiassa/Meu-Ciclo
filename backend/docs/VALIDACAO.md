# Evidências da primeira implementação do backend

Ambiente: Node 24.22.1, npm 11.9.0, Linux. Testes locais do assistente com dados fictícios.
Não representam testes manuais realizados pelos integrantes nem validação do Expo.

- `npm test`: 9 cenários aprovados, cobrindo as 20 operações REST dos quatro recursos.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado (JavaScript com checkJs/JSDoc, sem gerar código).

Cobertura funcional: criação/leitura/edição/exclusão, GET por ID, booleanos na resposta,
IDs inexistentes, senha não retornada, hash de senha, sessão expirada/revogada, usuário
em conflito, isolamento de perfis em leitura/escrita/exclusão, relação inválida no endpoint
e FK no SQLite, datas impossíveis, intervalo inválido, telefone incompleto, campos extras,
JSON inválido, corpo excessivo, consultas parametrizadas, CORS e ausência de cache.

Persistência: a suíte cria perfil e filhos em arquivo SQLite temporário, fecha o servidor
e o banco, abre uma nova instância e recupera os dados por HTTP. Excluir o Perfil depois
remove suas filhas e sessões. Isso verifica persistência entre instâncias, sem afirmar
que foram testados desligamento abrupto, corrupção de disco ou recuperação de backup.

Pendente: revisão do contrato pelo grupo, teste em rede/dispositivo, integração de cada
tela, Quick Exit, modelo DS, requisitos completos E3 e pacote final. Manter cartões em
validação, sem declarar a Entrega 4 concluída.
