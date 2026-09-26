#!/usr/bin/env python3
"""Cria cópias anonimizadas dos artefatos de cada run de uma etapa para julgamento cego."""
import json, random, shutil, subprocess, sys
from pathlib import Path
B = Path(__file__).resolve().parent
import os
WORK = Path(os.environ.get("PM_BENCH_WORK", "/tmp/pm-bench"))
stage = sys.argv[1]
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
runs = sorted([d for d in (WORK / "runs" / stage).iterdir() if (d / "summary.json").exists()])
labels = [chr(ord("A") + i) for i in range(len(runs))]
random.Random(seed + len(stage)).shuffle(labels)
out = WORK / "judge" / stage
if out.exists(): shutil.rmtree(out)
out.mkdir(parents=True)
mapping = {}
for lab, d in zip(labels, runs):
    mapping[lab] = d.name
    dst = out / lab
    dst.mkdir()
    work = d / "work"
    # arquivos alterados pela run (exclui .git e o skill)
    base = subprocess.run("git rev-list --max-parents=0 HEAD", cwd=work, shell=True, capture_output=True, text=True).stdout.split()[0]
    files = subprocess.run(f"git log --format= --name-only --diff-filter=AMR HEAD~{0}", cwd=work, shell=True, capture_output=True, text=True).stdout
    changed = subprocess.run("git diff --name-only $(git log --format=%H | sed -n '2p') HEAD 2>/dev/null", cwd=work, shell=True, capture_output=True, text=True).stdout
    # usa o diff.patch da run: lista de arquivos tocados
    touched = [l.split(" b/")[-1] for l in (d / "diff.patch").read_text().splitlines() if l.startswith("diff --git")]
    for f in touched:
        src = work / f
        if src.exists() and ".claude/skills" not in f:
            (dst / "artifacts" / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(src, dst / "artifacts" / f)
    shutil.copy(d / "final.md", dst / "final_response.md")
    s = json.loads((d / "summary.json").read_text())
    (dst / "handoff_check.json").write_text(json.dumps(s["handoff"], ensure_ascii=False))
(WORK / "judge" / f"{stage}.mapping.json").write_text(json.dumps(mapping, indent=1))
print(stage, {k: v for k, v in sorted(mapping.items())} if "--show" in sys.argv else len(mapping))
