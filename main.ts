// Remova qualquer linha de "import" do topo que aponte para https://deno.com ou https://deno.land
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// O Deno.serve já é nativo, não precisa importar nada!
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Lida com a verificação de segurança (CORS) do navegador
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rota Principal
  if (url.pathname === "/") {
    return new Response(
      JSON.stringify({ status: "API Online", projeto: "Elo Digital" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Rota para criar Elos
  if (url.pathname === "/elos" && req.method === "POST") {
    try {
      const body = await req.json();
      return new Response(
        JSON.stringify({ mensagem: "Elo criado com sucesso!", dados: body }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );
    } catch {
      return new Response(
        JSON.stringify({ erro: "Erro ao ler o JSON enviado" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
  }

  return new Response("Não encontrado", { headers: corsHeaders, status: 404 });
});