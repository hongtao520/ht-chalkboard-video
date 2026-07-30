#!/usr/bin/env python3
"""Securely configure only the Fish credential used by this skill."""

from __future__ import annotations

import argparse
import getpass
import json
import os
from pathlib import Path


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def configured() -> bool:
    if os.environ.get("FISH_API_KEY", "").strip():
        return True
    if not ENV_PATH.is_file():
        return False
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == "FISH_API_KEY" and value.strip().strip("'\""):
            return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        print(f"credential file: {ENV_PATH}")
        print("Fish Audio voice: configured" if configured() else "missing: FISH_API_KEY")
        raise SystemExit(0 if configured() else 1)
    value = getpass.getpass("Fish Audio API Key: ").strip()
    if not value:
        raise SystemExit("Fish Audio API Key is required; no file was written")
    existing = ENV_PATH.read_text(encoding="utf-8").splitlines() if ENV_PATH.is_file() else []
    updated: list[str] = []
    replaced = False
    for raw in existing:
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            name, _ = line.split("=", 1)
            if name.strip() == "FISH_API_KEY":
                updated.append(f"FISH_API_KEY={json.dumps(value)}")
                replaced = True
                continue
        updated.append(raw)
    if not replaced:
        if updated and updated[-1].strip():
            updated.append("")
        updated.append(f"FISH_API_KEY={json.dumps(value)}")
    ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    ENV_PATH.write_text("\n".join(updated).rstrip() + "\n", encoding="utf-8")
    ENV_PATH.chmod(0o600)
    print(f"saved Fish credential to {ENV_PATH} (mode 0600)")


if __name__ == "__main__":
    main()
