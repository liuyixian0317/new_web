python - <<'PY'
import os, json, requests

api_key = os.getenv("ARK_API_KEY")
if not api_key:
    raise SystemExit("缺少 ARK_API_KEY")

url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
payload = {
    "model": "doubao-seed-1-6-251015",
    "messages": [
        {"role": "user", "content": [{"type": "text", "text": "你好，帮我打个招呼"}]}
    ],
    "stream": True,
}
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json",
    "Accept-Charset": "utf-8",
}

resp = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
resp.raise_for_status()

print("响应编码声明:", resp.encoding)
for raw in resp.iter_lines(decode_unicode=False):
    if not raw:
        continue
    print("原始 bytes:", raw[:80])
    try:
        print("UTF-8 解码:", raw.decode("utf-8"))
    except UnicodeDecodeError as exc:
        print("UTF-8 解码失败:", exc)
        print("latin-1 解码后再转 UTF-8:", raw.decode("latin-1").encode("latin-1").decode("utf-8"))
    break  # 只看第一行
PY
