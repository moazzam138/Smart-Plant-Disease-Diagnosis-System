"""Collect API evidence for the progress presentation (Week 2 evidence table:
"API evidence - endpoint test, response JSON").

Start the server first, then in a second terminal (backend folder, venv active):
  python scripts/api_evidence.py path\\to\\leaf1.jpg path\\to\\leaf2.jpg
  python scripts/api_evidence.py leaf.jpg --url http://192.168.1.25:8000

Saves reports/api_evidence/<timestamp>/ with health.json, one JSON per image,
negative tests, and a summary.md you can paste into the report.
Uses only the Python standard library.
"""
import argparse
import json
import mimetypes
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path

REPORTS = Path(__file__).resolve().parents[1] / "reports" / "api_evidence"


def call(method: str, url: str, body: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach {url}: {e.reason}\nIs the server running? (uvicorn app.main:app ...)")
    ms = (time.perf_counter() - start) * 1000
    try:
        data = json.loads(raw or b"null")
    except json.JSONDecodeError:
        data = raw.decode(errors="replace")
    return status, data, ms


def multipart(field: str, filename: str, content: bytes, ctype: str):
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; "
        f"filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n"
    ).encode() + content + f"\r\n--{boundary}--\r\n".encode()
    return body, {"Content-Type": f"multipart/form-data; boundary={boundary}"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("images", nargs="+", type=Path)
    ap.add_argument("--url", default="http://127.0.0.1:8000")
    args = ap.parse_args()
    base = args.url.rstrip("/")

    out = REPORTS / datetime.now().strftime("%Y%m%d_%H%M%S")
    out.mkdir(parents=True)
    lines = [f"# API evidence - {datetime.now():%Y-%m-%d %H:%M}", "", f"Server: `{base}`", ""]

    status, health, ms = call("GET", f"{base}/health")
    (out / "health.json").write_text(json.dumps(health, indent=2))
    print(f"GET /health -> {status} ({ms:.0f} ms)  status={health.get('status')}")
    model = health.get("model", {})
    lines += ["## GET /health", "", f"- HTTP {status}, status `{health.get('status')}`",
              f"- Model: `{model.get('name')}` ({model.get('file')}), loaded={model.get('loaded')}, "
              f"input {model.get('input_size')}, preprocessing `{model.get('preprocessing')}`",
              f"- Database connected: {health.get('database', {}).get('connected')}", "",
              "## POST /predict", "",
              "| Image | HTTP | disease (raw label) | display name | confidence | server inference ms | round-trip ms |",
              "|---|---|---|---|---|---|---|"]

    for img in args.images:
        ctype = mimetypes.guess_type(img.name)[0] or "application/octet-stream"
        body, headers = multipart("image", img.name, img.read_bytes(), ctype)
        status, data, ms = call("POST", f"{base}/predict", body, headers)
        (out / f"predict_{img.stem}.json").write_text(json.dumps(data, indent=2))
        if status == 200:
            print(f"POST /predict {img.name} -> {status}  {data['display_name']} "
                  f"({data['confidence']:.1%})  {ms:.0f} ms")
            lines.append(f"| {img.name} | {status} | `{data['disease']}` | {data['display_name']} | "
                         f"{data['confidence']:.4f} | {data['inference_ms']} | {ms:.0f} |")
        else:
            print(f"POST /predict {img.name} -> {status}  {data}")
            lines.append(f"| {img.name} | {status} | error: {data} | | | | {ms:.0f} |")

    # Negative tests: prove input validation works
    lines += ["", "## Input validation", "", "| Test | Expected | Got |", "|---|---|---|"]
    negatives = [
        ("No image field", *multipart("file", "x.jpg", b"x", "image/jpeg"), 400),
        ("Text file", *multipart("image", "notes.txt", b"hello", "text/plain"), 415),
        ("Corrupt JPEG", *multipart("image", "bad.jpg", b"\xff\xd8\xffgarbage", "image/jpeg"), 400),
    ]
    for name, body, headers, expected in negatives:
        status, data, _ = call("POST", f"{base}/predict", body, headers)
        verdict = "PASS" if status == expected else "FAIL"
        print(f"{verdict}  {name}: expected {expected}, got {status}")
        lines.append(f"| {name} | {expected} | {status} ({verdict}) |")

    (out / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nSaved evidence to {out}")


if __name__ == "__main__":
    main()
