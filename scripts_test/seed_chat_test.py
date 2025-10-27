#!/usr/bin/env python3
import json
import os
import sys

import requests


def main() -> None:
    api_key = os.getenv("ARK_API_KEY")
    if not api_key:
        print("ARK_API_KEY environment variable is required", file=sys.stderr)
        sys.exit(1)

    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    payload = {
        "model": "doubao-seed-1-6-251015",
        "max_completion_tokens": 65535,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                        },
                    },
                    {
                        "type": "text",
                        "text": "图片主要讲了什么?",
                    },
                ],
            }
        ],
        "reasoning_effort": "medium",
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()

    data = response.json()
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
