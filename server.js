const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
let requestCount = 0;
const startedAt = Date.now();

async function getInstanceId() {
  try {
    const tokenResponse = await fetch(
      "http://169.254.169.254/latest/api/token",
      { method: "PUT", headers: { "X-aws-ec2-metadata-token-ttl-seconds": "21600" }, signal: AbortSignal.timeout(700) }
    );
    if (!tokenResponse.ok) return "local-or-metadata-unavailable";
    const token = await tokenResponse.text();
    const idResponse = await fetch(
      "http://169.254.169.254/latest/meta-data/instance-id",
      { headers: { "X-aws-ec2-metadata-token": token }, signal: AbortSignal.timeout(700) }
    );
    return idResponse.ok ? await idResponse.text() : "metadata-unavailable";
  } catch {
    return "local-or-metadata-unavailable";
  }
}

const instanceIdPromise = getInstanceId();

function send(res, status, body, type = "application/json") {
  res.writeHead(status, {
    "Content-Type": `${type}; charset=utf-8`,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(type === "application/json" ? JSON.stringify(body, null, 2) : body);
}

const server = http.createServer((req, res) => {
  requestCount += 1;

  if (req.url === "/health") {
    return send(res, 200, { status: "healthy", hostname: os.hostname() });
  }

  if (req.url === "/api/status") {
    return instanceIdPromise.then(instanceId => send(res, 200, {
      status: "running",
      application: "AWS Traffic Management Dashboard",
      instanceId,
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      uptimeSeconds: Math.floor(process.uptime()),
      totalRequestsOnThisInstance: requestCount,
      startedAt: new Date(startedAt).toISOString(),
      timestamp: new Date().toISOString()
    }));
  }

  if (req.url === "/" || req.url === "/index.html") {
    const html = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
    return send(res, 200, html, "text/html");
  }

  return send(res, 404, { error: "Not found", path: req.url });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Traffic dashboard running on port ${PORT}`);
});

function shutdown() {
  console.log("Shutting down gracefully...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
