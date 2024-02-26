import * as db from "./mocks/db.json";

/** @typedef {{}} Env */

/** @type {ExportedHandler<Env>} */
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (e) {
      console.error(e);

      const { message, stack } = /** @type {Error} */ (e);
      console.error(stack);

      return Response.json({ error: message }, { status: 500 });
    } finally {
      // logger.send();
    }
  },
};

/**
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} ctx
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  let { pathname, searchParams } = url;
  pathname = pathname.replace(/\/+$/, "") || "/";

  const headers = {
    "access-control-allow-origin":
      request.headers.get("origin") || "http://localhost:5173",
    vary: "origin, accept-encoding",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-headers": "content-type, authorization",
        "access-control-allow-methods": "OPTIONS, POST",
        allow: "OPTIONS, POST",
        ...headers,
      },
    });
  }

  if (request.method === "GET" && pathname === "/api/combine") {
    return Response.json(db.combine, { headers });
  }

  if (request.method === "GET" && pathname === "/api/get_conversations") {
    return Response.json(db.conversations, { headers });
  }

  if (request.method === "GET" && pathname === "/api/get_single_conversation") {
    return Response.json(
      db.conversations.find((c) => c.id === searchParams.get("id")),
      { headers }
    );
  }

  if (request.method === "POST" && pathname === "/stream") {
    const message = "Hi, How are you today?".split(" ");

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async pull(controller) {
          for (const word of message) {
            controller.enqueue(
              encoder.encode(`data: {"answer": "${word} "}\n`)
            );
            await new Promise((r) => setTimeout(r, 100));
          }
          controller.enqueue(
            encoder.encode(
              `data: {"type": "id", "id": "65cbc39d11f077b9eeb06d26"}\n`
            )
          );
          controller.enqueue(encoder.encode(`data: {"type": "end"}\n`));
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...headers,
        },
      }
    );
  }

  if (request.method === "POST" && pathname === "/api/search") {
    return Response.json(
      [
        {
          text: "\n\n/api/answer\nIt's a POST request that sends a JSON in body with 4 values. It will receive an answer for a user provided question.\n",
          title: "API-docs.md",
        },
        {
          text: "\n\nOur Standards\n\nExamples of behavior that contribute to a positive environment for our\ncommunity include:\n* Demonstrating empathy and kindness towards other people\n",
          title: "How-to-use-different-LLM.md",
        },
      ],
      { headers }
    );
  }

  // http://localhost:8787/api/get_single_conversation?id=65cf39ba36523eea21ebe116

  // /api/combine
  // /api/get_conversations

  return Response.json({ error: "not found" }, { status: 404, headers });
}
