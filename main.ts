// 1. Abrimos o banco de dados
const kv = await Deno.openKv();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ROTA: Listar todos os Elos (GET /elos)
  if (url.pathname === "/elos" && req.method === "GET") {
    const elos = [];
    for await (const entry of kv.list({ prefix: ["elos"] })) {
      elos.push(entry.value);
    }
    return new Response(JSON.stringify(elos), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ROTA: Criar um novo Elo (POST /elos)
  if (url.pathname === "/elos" && req.method === "POST") {
    try {
      const body = await req.json();
      
      // CORREÇÃO: use 'crypto' com 'c' minúsculo
      const id = crypto.randomUUID(); 
      
      const novoElo = { id, ...body, criadoEm: new Date().toISOString() };

      await kv.set(["elos", id], novoElo);

      return new Response(JSON.stringify({ mensagem: "Salvo no Deno KV!", elo: novoElo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    } catch (e) {
      console.error(e); // Isso vai mostrar o erro real no terminal do servidor
      return new Response(JSON.stringify({ erro: "Erro ao processar dados", detalhes: e.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  }

  return new Response("API Elo Digital", { headers: corsHeaders });
});