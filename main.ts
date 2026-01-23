import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// 1. INICIALIZAÇÃO DO BANCO E I.A.
const kv = await Deno.openKv();
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 2. CONFIGURAÇÃO DE CABEÇALHOS (CORS) - Fundamental para o site funcionar
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Lidar com requisições de segurança do navegador
  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    // --- ROTA DE REGISTRO ---
    if (req.method === "POST" && url.pathname === "/registrar") {
      const { email, senha } = await req.json();
      const userKey = ["usuarios", email];
      const userCheck = await kv.get(userKey);
      if (userCheck.value) return Response.json({ erro: "E-mail já cadastrado" }, { status: 400, headers });
      await kv.set(userKey, { email, senha, nome: email.split('@')[0], cor: "#7B2CBF" });
      return Response.json({ mensagem: "Usuário criado" }, { headers });
    }

    // --- ROTA DE LOGIN ---
    if (req.method === "POST" && url.pathname === "/login") {
      const { email, senha } = await req.json();
      const user = await kv.get(["usuarios", email]);
      if (user.value && (user.value as any).senha === senha) {
        return Response.json({ mensagem: "Sucesso" }, { headers });
      }
      return Response.json({ erro: "Credenciais inválidas" }, { status: 401, headers });
    }

    // --- ROTA: CRIAR NOVO ELO (Botão +) ---
    if (req.method === "POST" && url.pathname === "/elos") {
      const body = await req.json();
      const id = crypto.randomUUID(); 
      const novoElo = { id, ...body, criadoEm: new Date().toISOString() };
      await kv.set(["elos", id], novoElo);
      // Inicia o score deste novo elo
      await kv.set(["scores", body.email || id], { total: 100, qtd: 1, media: 100 });
      return Response.json({ mensagem: "Salvo no Deno KV!", elo: novoElo }, { status: 201, headers });
    }

    // --- ROTA: LISTAR TODOS OS ELOS ---
    if (url.pathname === "/elos" && req.method === "GET") {
      const iter = kv.list({ prefix: ["elos"] });
      const elos = [];
      for await (const res of iter) elos.push(res.value);
      return Response.json(elos, { headers });
    }

    // --- ROTA: BUSCAR SCORE ---
    if (req.method === "GET" && url.pathname.startsWith("/score/")) {
      const email = url.pathname.split("/")[2];
      const score = await kv.get(["scores", email]);
      return Response.json(score.value || { media: 0 }, { headers });
    }

    // --- DEPOIMENTOS COM I.A. E SCORE ---
    if (req.method === "POST" && url.pathname === "/depoimentos/salvar-com-score") {
      const { para, de, texto, nomeDe, notaIA } = await req.json();
      const timestamp = Date.now();
      await kv.set(["depoimentos", para, timestamp], { de, nomeDe, texto, notaIA, data: new Date().toLocaleDateString('pt-BR') });

      const scoreKey = ["scores", para];
      const currentScore = await kv.get(scoreKey);
      let novoScore;
      if (currentScore.value) {
        const { total, qtd } = currentScore.value as any;
        novoScore = { total: total + notaIA, qtd: qtd + 1, media: Math.round((total + notaIA) / (qtd + 1)) };
      } else {
        novoScore = { total: notaIA, qtd: 1, media: notaIA };
      }
      await kv.set(scoreKey, novoScore);
      return Response.json({ mensagem: "Score atualizado!", media: novoScore.media }, { headers });
    }

    // --- INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
    if (req.method === "POST" && url.pathname === "/ia/analisar") {
      const { depoimento } = await req.json();
      const prompt = `Você é a Elo Digital I.A. Analise este depoimento: "${depoimento}". Dê uma nota de 0 a 100 para caráter. Responda APENAS o JSON puro, sem blocos de código: {"nota": 0, "comentario": ""}`;
      const result = await model.generateContent(prompt);
      const resText = result.response.text().replace(/```json|```/g, "").trim();
      return new Response(resText, { headers });
    }

    // --- SISTEMA DE CHAT ---
    if (req.method === "POST" && url.pathname === "/mensagens/enviar") {
      const { de, para, texto } = await req.json();
      const sala = [de, para].sort().join("_"); 
      await kv.set(["mensagens", sala, Date.now()], { de, texto, data: new Date().toLocaleTimeString() });
      return Response.json({ mensagem: "Enviada" }, { headers });
    }

    if (req.method === "GET" && url.pathname.startsWith("/mensagens/ler/")) {
      const sala = url.pathname.split("/")[3];
      const iter = kv.list({ prefix: ["mensagens", sala] });
      const mensagens = [];
      for await (const res of iter) mensagens.push(res.value);
      return Response.json(mensagens, { headers });
    }

    // --- ROTA PARA POPULAR O BANCO (SEED) ---
    if (url.pathname === "/adm/seed-dados") {
      const seedElo = { id: crypto.randomUUID(), nome: "Thiago Silva", email: "thiago@elo.com", cor: "#7B2CBF", local: "Brasil" };
      await kv.set(["elos", seedElo.id], seedElo);
      await kv.set(["scores", seedElo.email], { total: 95, qtd: 1, media: 95 });
      return Response.json({ mensagem: "Banco de dados iniciado!" }, { headers });
    }

    // Resposta padrão caso a rota não exista (Sempre JSON)
    return Response.json({ status: "Online", app: "Elo Digital" }, { headers });

  } catch (error) {
    return Response.json({ erro: "Erro interno no servidor", detalhes: error.message }, { status: 500, headers });
  }
});