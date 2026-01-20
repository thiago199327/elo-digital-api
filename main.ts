import { serve } from "https://deno.land";

// Isso é para que a API possa ser acessada pelo seu aplicativo em qualquer lugar (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Esta função lida com todas as requisições que chegam na sua API
serve(async (req) => {
  const url = new URL(req.url);

  // Rota principal para verificar se a API está funcionando
  if (url.pathname === "/") {
    return new Response("API do Elo Digital funcionando!", { headers: corsHeaders });
  }

  // Rota para criar um novo "Elo" (o que você desenhou no Figma)
  if (url.pathname === "/elos" && req.method === "POST") {
    // Aqui é onde o código para salvar os dados no banco de dados (Deno KV) entraria
    // Por enquanto, apenas retornamos uma mensagem de sucesso
    return new Response("Novo Elo criado com sucesso!", { headers: corsHeaders, status: 201 });
  }

  // Se a rota não for encontrada, retorna 404
  return new Response("Página não encontrada", { headers: corsHeaders, status: 404 });
});
