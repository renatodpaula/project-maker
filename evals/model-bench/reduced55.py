#!/usr/bin/env python3
"""Matriz reduzida: Sonnet 5.5 medium vs high (referência: Sonnet 5 high da cadeia golden).

Etapas: discover, init, spec, plan. A cadeia golden usa sonnet-high e fornece o insumo congelado
de cada etapa; as duas configs novas partem do mesmo snapshot. Serial, para não estourar a janela de 5h.
"""
import json, os, sys
from pathlib import Path
import bench

STAGES = ["discover", "init", "spec", "break", "plan"]
JUDGED = {"discover", "init", "spec", "plan"}
NEW = ["sonnet55-medium", "sonnet55-high"]

base = bench.make_base() if not (bench.GOLDEN / "00-base").exists() else bench.GOLDEN / "00-base"
src = base
arg = ""
for st in STAGES:
    gdir = bench.GOLDEN / f"{st}-golden"
    if (gdir / "summary.json").exists():
        s = json.loads((gdir / "summary.json").read_text())
    else:
        s = bench.run_with_retry(st, "sonnet-high", src, gdir, arg)
    print(json.dumps({"golden": st, "cost": s["cost_usd"], "wall": s["wall_s"], "handoff": s["handoff"]}, ensure_ascii=False), flush=True)
    if st in JUDGED:
        for cfg in NEW:
            out = bench.RUNS / st / f"{cfg}-r1"
            if not (out / "summary.json").exists():
                r = bench.run_with_retry(st, cfg, src, out, arg)
                print(json.dumps({"stage": st, "config": cfg, "cost": r["cost_usd"], "wall": r["wall_s"],
                                  "turns": r["num_turns"], "handoff": r["handoff"]}, ensure_ascii=False), flush=True)
        link = bench.RUNS / st / "sonnet-high-r1"
        if not link.exists():
            link.symlink_to(gdir)
    src = gdir / "work"
    cmd = (s["handoff"] or {}).get("cmd") or ""
    parts = cmd.split()
    arg = " ".join(parts[2:]) if len(parts) > 2 else ""
print("DONE", flush=True)
