"""Convenience launcher for the Seed Agent backend."""

from __future__ import annotations

import logging

import uvicorn


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(
        "backend.server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
