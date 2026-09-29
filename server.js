import http from "node:http";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "gpt-5.6-luna";

const SYSTEM_PROMPT = `
أنت A5، مساعد ذكاء اصطناعي متطور.

كن ذكيًا، مباشرًا، وتحليليًا.
لا توافق المستخدم لمجرد إرضائه.
إذا كانت الفكرة ضعيفة، وضح السبب واقترح طريقة أفضل.
انتقد الأفكار وليس الأشخاص.
عند البرمجة، أعطِ حلولًا عملية وكودًا صحيحًا.
لا تدّعي تنفيذ شيء لم تنفذه.
إذا لم تعرف معلومة، قل ذلك بوضوح.
استخدم لغة المستخدم.
`;

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    });

    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 2_000_000) {
                reject(new Error("Request too large"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(JSON.parse(body || "{}"));
            } catch {
                reject(new Error("Invalid JSON"));
            }
        });

        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {

    // CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        });

        return res.end();
    }

    // Health check
    if (req.method === "GET" && req.url === "/") {
        return sendJSON(res, 200, {
            status: "online",
            name: "A5 AI",
            message: "A5 backend is running."
        });
    }

    // AI endpoint
    if (req.method === "POST" && req.url === "/api/chat") {

        if (!API_KEY) {
            return sendJSON(res, 500, {
                error: "AI_API_KEY غير موجود في Railway."
            });
        }

        try {

            const body = await readBody(req);

            const message =
                typeof body.message === "string"
                    ? body.message.trim()
                    : "";

            const messages =
                Array.isArray(body.messages)
                    ? body.messages
                    : [];

            if (!message) {
                return sendJSON(res, 400, {
                    error: "الرسالة فارغة."
                });
            }

            const history = messages
                .filter(item =>
                    item &&
                    (item.role === "user" ||
                     item.role === "assistant") &&
                    typeof item.content === "string"
                )
                .slice(-20)
                .map(item => ({
                    role: item.role,
                    content: item.content.slice(0, 12000)
                }));

            const conversation = [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                ...history
            ];

            const last = conversation[conversation.length - 1];

            if (!last || last.role !== "user" || last.content !== message) {
                conversation.push({
                    role: "user",
                    content: message
                });
            }

            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_KEY}`
                    },

                    body: JSON.stringify({
                        model: MODEL,
                        messages: conversation,
                        temperature: 0.7,
                        max_tokens: 3000
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("OpenAI error:", data);

                return sendJSON(res, response.status, {
                    error:
                        data?.error?.message ||
                        "حدث خطأ من خدمة الذكاء الاصطناعي."
                });
            }

            const reply =
                data?.choices?.[0]?.message?.content;

            if (!reply) {
                return sendJSON(res, 500, {
                    error: "لم تصل إجابة من النموذج."
                });
            }

            return sendJSON(res, 200, {
                reply,
                model: data.model || MODEL
            });

        } catch (error) {

            console.error("A5 server error:", error);

            return sendJSON(res, 500, {
                error: "حدث خطأ داخلي في A5."
            });
        }
    }

    return sendJSON(res, 404, {
        error: "Not Found"
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`A5 AI running on port ${PORT}`);
});
