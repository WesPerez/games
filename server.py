import http.server
import urllib.parse
import urllib.request
import ssl
import io
import os
import sys
import json
import hashlib
import threading
import time
from socketserver import ThreadingMixIn
from PIL import Image

# Bypass SSL verification for upstream API (certificate mismatch on CDN)
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

UPSTREAM = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"
PORT = 8000
SERVE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(SERVE_DIR, ".cache")
CACHE_DIR_LOCK = threading.Lock()

CACHE = {}
CACHE_LOCK = threading.Lock()
WARMUP_STATUS = {"running": False, "done": 0, "total": 0, "errors": []}


def cache_path(key: str) -> str:
    return os.path.join(CACHE_DIR, f"{key}.png")


def load_disk_cache():
    if not os.path.isdir(CACHE_DIR):
        return
    count = 0
    bytes_total = 0
    for name in os.listdir(CACHE_DIR):
        if not name.endswith(".png"):
            continue
        key = name[:-4]
        path = os.path.join(CACHE_DIR, name)
        try:
            size = os.path.getsize(path)
            with open(path, "rb") as f:
                data = f.read()
            with CACHE_LOCK:
                CACHE[key] = data
            count += 1
            bytes_total += size
        except OSError:
            pass
    if count:
        print(f"[cache] loaded {count} files ({bytes_total/1024/1024:.1f} MB) from disk", flush=True)


def save_to_disk(key: str, png: bytes):
    with CACHE_DIR_LOCK:
        os.makedirs(CACHE_DIR, exist_ok=True)
        path = cache_path(key)
        if os.path.exists(path) and os.path.getsize(path) == len(png):
            return
        tmp = path + ".tmp"
        with open(tmp, "wb") as f:
            f.write(png)
        os.replace(tmp, path)


def process_image(raw_bytes: bytes) -> bytes:
    # Validate: upstream must return image data, not JSON error
    if len(raw_bytes) < 100:
        try:
            text = raw_bytes.decode("utf-8")
            if '"code"' in text or '"message"' in text:
                raise ValueError(f"upstream API error: {text[:200]}")
        except UnicodeDecodeError:
            pass
    # Check JPEG/PNG/WebP magic bytes
    if not (raw_bytes[:2] == b'\xff\xd8' or raw_bytes[:4] == b'\x89PNG' or raw_bytes[:4] == b'RIFF'):
        # Not an image — could be JSON error from upstream
        try:
            text = raw_bytes.decode("utf-8")
            raise ValueError(f"upstream returned non-image: {text[:200]}")
        except UnicodeDecodeError:
            raise ValueError(f"upstream returned unrecognized data ({len(raw_bytes)} bytes, magic: {raw_bytes[:4].hex()})")

    img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # 检测占位图特征：大面积均匀灰色背景（API 返回 "generating" 占位图）
    # 采样多个区域，如果颜色方差极低，说明是占位图
    sample_points = []
    step = max(1, min(w, h) // 20)
    for y in range(0, h, step):
        for x in range(0, w, step):
            sample_points.append(pixels[x, y])

    if len(sample_points) > 10:
        # 计算颜色方差
        r_vals = [p[0] for p in sample_points]
        g_vals = [p[1] for p in sample_points]
        b_vals = [p[2] for p in sample_points]
        r_var = sum((v - sum(r_vals)/len(r_vals))**2 for v in r_vals) / len(r_vals)
        g_var = sum((v - sum(g_vals)/len(g_vals))**2 for v in g_vals) / len(g_vals)
        b_var = sum((v - sum(b_vals)/len(b_vals))**2 for v in b_vals) / len(b_vals)
        avg_var = (r_var + g_var + b_var) / 3

        # 真实图像的颜色方差通常 > 500，占位图 < 100
        if avg_var < 100:
            raise ValueError(f"image appears to be a placeholder (color variance={avg_var:.0f}, threshold=100) — upstream returned generating/default image")

    # 检测图像是否主要是纯白色背景（占位图特征）
    corner_samples = []
    sample_positions = [
        (2, 2), (w-3, 2), (2, h-3), (w-3, h-3),
        (w//4, 2), (3*w//4, 2),
        (w//4, h-3), (3*w//4, h-3),
    ]
    for sx, sy in sample_positions:
        if 0 <= sx < w and 0 <= sy < h:
            corner_samples.append(pixels[sx, sy])

    bg_is_white = all(r > 230 and g > 230 and b > 230 for r, g, b, a in corner_samples)

    if bg_is_white:
        visited = set()
        from collections import deque
        queue = deque()

        for x in range(w):
            for y in [0, h-1]:
                r, g, b, a = pixels[x, y]
                if r >= 240 and g >= 240 and b >= 240 and a > 0:
                    queue.append((x, y))
        for y in range(h):
            for x in [0, w-1]:
                r, g, b, a = pixels[x, y]
                if r >= 240 and g >= 240 and b >= 240 and a > 0:
                    queue.append((x, y))

        while queue:
            x, y = queue.popleft()
            if (x, y) in visited:
                continue
            if x < 0 or x >= w or y < 0 or y >= h:
                continue
            r, g, b, a = pixels[x, y]
            if r < 235 or g < 235 or b < 235 or a == 0:
                continue
            visited.add((x, y))
            pixels[x, y] = (r, g, b, 0)
            queue.append((x-1, y))
            queue.append((x+1, y))
            queue.append((x, y-1))
            queue.append((x, y+1))

        transparent = sum(1 for y in range(h) for x in range(w) if pixels[x, y][3] == 0)
        total = w * h
        if total > 0 and transparent / total > 0.5:
            raise ValueError(f"image is {transparent}/{total} ({100*transparent//total}%) transparent after white removal — upstream likely returned a default/blank image")

    out = io.BytesIO()
    img.save(out, format="PNG", optimize=True)
    return out.getvalue()


def fetch_and_process(prompt: str, size: str) -> bytes:
    cache_key = hashlib.md5(f"{prompt}|{size}".encode()).hexdigest()
    with CACHE_LOCK:
        if cache_key in CACHE:
            return CACHE[cache_key]
    upstream_url = f"{UPSTREAM}?prompt={urllib.parse.quote(prompt)}&image_size={size}"
    req = urllib.request.Request(upstream_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120, context=SSL_CTX) as resp:
        data = resp.read()
    png = process_image(data)
    with CACHE_LOCK:
        CACHE[cache_key] = png
    save_to_disk(cache_key, png)
    return png


def warmup(items):
    WARMUP_STATUS["running"] = True
    WARMUP_STATUS["done"] = 0
    WARMUP_STATUS["total"] = len(items)
    WARMUP_STATUS["errors"] = []
    print(f"[warmup] starting {len(items)} images", flush=True)
    started = time.time()
    for idx, it in enumerate(items):
        prompt = it.get("prompt", "")
        size = it.get("size", "square_hd")
        try:
            fetch_and_process(prompt, size)
        except Exception as e:
            WARMUP_STATUS["errors"].append({"idx": idx, "prompt": prompt[:60], "err": str(e)[:120]})
            print(f"[warmup] {idx+1}/{len(items)} FAILED: {e}", flush=True)
        else:
            elapsed = time.time() - started
            rate = (idx + 1) / elapsed if elapsed > 0 else 0
            print(f"[warmup] {idx+1}/{len(items)} ok (avg {rate:.2f}/s)", flush=True)
        WARMUP_STATUS["done"] = idx + 1
    WARMUP_STATUS["running"] = False
    print(f"[warmup] done in {time.time()-started:.1f}s", flush=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        # Don't cache API responses long — prevents stale placeholder images
        if self.path.startswith("/api/image"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        super().end_headers()

    def _json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/image":
            qs = urllib.parse.parse_qs(parsed.query)
            prompt = qs.get("prompt", [""])[0]
            size = qs.get("image_size", ["square_hd"])[0]
            try:
                png = fetch_and_process(prompt, size)
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(png)))
                self.end_headers()
                self.wfile.write(png)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(f"error: {e}".encode())
            return
        if parsed.path == "/api/cache/stats":
            disk_bytes = 0
            disk_count = 0
            if os.path.isdir(CACHE_DIR):
                for n in os.listdir(CACHE_DIR):
                    if n.endswith(".png"):
                        try:
                            disk_bytes += os.path.getsize(os.path.join(CACHE_DIR, n))
                            disk_count += 1
                        except OSError:
                            pass
            self._json(200, {
                "memory_keys": len(CACHE),
                "disk_files": disk_count,
                "disk_mb": round(disk_bytes / 1024 / 1024, 2),
                "warmup": WARMUP_STATUS,
            })
            return
        if parsed.path == "/api/warmup/status":
            self._json(200, WARMUP_STATUS)
            return
        if parsed.path == "/api/cache/clear":
            with CACHE_LOCK:
                CACHE.clear()
            count = 0
            if os.path.isdir(CACHE_DIR):
                for n in os.listdir(CACHE_DIR):
                    if n.endswith(".png"):
                        try:
                            os.remove(os.path.join(CACHE_DIR, n))
                            count += 1
                        except OSError:
                            pass
            self._json(200, {"cleared": count})
            return
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/warmup":
            if WARMUP_STATUS["running"]:
                self._json(409, {"error": "warmup already running", "status": WARMUP_STATUS})
                return
            length = int(self.headers.get("Content-Length", "0"))
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except Exception as e:
                self._json(400, {"error": f"bad json: {e}"})
                return
            items = body.get("items", [])
            if not isinstance(items, list) or not items:
                self._json(400, {"error": "items must be non-empty list"})
                return
            def runner():
                try:
                    warmup(items)
                except Exception as e:
                    WARMUP_STATUS["running"] = False
                    WARMUP_STATUS["errors"].append({"fatal": str(e)})
            t = threading.Thread(target=runner, daemon=True)
            t.start()
            self._json(202, {"accepted": len(items)})
            return
        self._json(404, {"error": "not found"})

    def log_message(self, format, *args):
        msg = format % args
        if "/api/" in msg or "404" in msg or "500" in msg:
            sys.stderr.write(msg + "\n")


if __name__ == "__main__":
    os.chdir(SERVE_DIR)
    load_disk_cache()

    class ThreadedServer(ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    server = ThreadedServer(("", PORT), Handler)
    print(f"serving {SERVE_DIR} on http://localhost:{PORT}/", flush=True)
    print(f"cache dir: {CACHE_DIR}", flush=True)
    server.serve_forever()
