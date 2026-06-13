import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number.parseInt(process.env.PORT ?? "8080", 10);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function resolvePath(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${port}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const cleanPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const normalizedPath = normalize(cleanPath).replace(/^([/\\])+/, "");
  const absolutePath = join(root, normalizedPath);

  if (!absolutePath.startsWith(root)) {
    return null;
  }
  return absolutePath;
}

const server = createServer(async (req, res) => {
  try {
    const path = resolvePath(req.url ?? "/");
    if (!path) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    const body = await readFile(path);
    const contentType = mimeTypes[extname(path)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    res.end(body);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
    res.end(status === 404 ? "Not found" : "Internal server error");
  }
});

server.listen(port, () => {
  console.log(`RSL Font Analyzer is available at http://localhost:${port}`);
});
