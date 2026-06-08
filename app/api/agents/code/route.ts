import { runCodeMode } from "@/lib/agents/codeanalyst";

export async function GET() { return new Response('OK'); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query || "";
    let result = "";
    
    await runCodeMode(query, (event) => {
      if (event.type === "complete" || event.type === "done") {
        if (event.payload.text) {
          result = event.payload.text;
        }
      }
    });
    
    return new Response(result, { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}