// Tiny OpenAI-compatible mock server for demos and offline development.
// It streams canned replies and requires the sample key below. It is NOT a real AI.
//   node scripts/mock-llm.mjs   (listens on :9999)
import http from "node:http";

const SAMPLE_KEY = "sk-sample-demo-key";
const PORT = Number(process.env.MOCK_PORT ?? 9999);

const replies = [
  [/dns/i, `**DNS** is the internet's phone book. It turns names like \`example.com\` into IP addresses.

1. Your browser asks a **resolver** (usually your ISP's) for the address.
2. The resolver asks a **root server**, then the **TLD server** (\`.com\`), then the site's **authoritative server**.
3. The answer is cached so the next lookup is instant.

| Record | Purpose |
| ------ | ------- |
| A | Name to IPv4 address |
| AAAA | Name to IPv6 address |
| CNAME | Alias to another name |`],
  [/react|useeffect/i, `In development, **React Strict Mode** mounts, unmounts and re-mounts every component once to surface bugs. That is why \`useEffect\` runs twice. It does not happen in production.

Make your effect safe to re-run by cleaning up after it:

\`\`\`tsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup runs between the two runs
}, []);
\`\`\``],
];
const fallback = `Hi! I'm a **mock model** running locally, so these replies are canned. Set a real \`INGON_API_KEY\` in \`.env.local\` to talk to a real model.`;

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    if (req.headers.authorization !== `Bearer ${SAMPLE_KEY}`) {
      res.writeHead(401).end(JSON.stringify({ error: "bad key" }));
      return;
    }
    const { messages = [] } = JSON.parse(body || "{}");
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const text = (replies.find(([re]) => re.test(last)) ?? [null, fallback])[1];

    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    for (const tok of text.match(/\S+\s*|\s+/g) ?? []) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: tok } }] })}\n\n`);
      await new Promise((r) => setTimeout(r, 35));
    }
    res.write("data: [DONE]\n\n");
    res.end();
  });
}).listen(PORT, () => console.log(`mock LLM on http://localhost:${PORT}/v1  (key: ${SAMPLE_KEY})`));
