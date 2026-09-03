#!/usr/bin/env python3
"""Pull AAFC + NASS + FAO and write src/data/*.json."""
import subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def run(name: str, optional: bool = False):
    print("==", name, flush=True)
    r = subprocess.run([sys.executable, str(HERE / name)], check=False)
    if r.returncode and not optional:
        sys.exit(r.returncode)
    if r.returncode:
        print("skip/fail", name, r.returncode)


if __name__ == "__main__":
    run("collect_fao.py")
    run("collect_aafc.py")
    run("collect_nass.py", optional=True)
    print("refresh complete")
