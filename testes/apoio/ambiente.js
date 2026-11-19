// Define a URL da API antes de qualquer módulo carregar services/api.js:
// o cliente compartilhado lê EXPO_PUBLIC_API_URL uma única vez, na inicialização do módulo.
// Importar este arquivo como PRIMEIRO import dos testes unitários (o fetch é simulado).
process.env.EXPO_PUBLIC_API_URL ??= "http://api.teste";
