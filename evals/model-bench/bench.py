#!/usr/bin/env python3
"""Benchmark de modelos por etapa do skill project-maker.

Cada run: copia um snapshot golden -> workdir isolado, roda `claude -p "/project-maker <modo> <alvo>"`
com um modelo/effort, captura transcript stream-json, métricas (custo, tempo, tokens), diff e handoff.
"""
import argparse, json, os, re, shutil, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

B = Path(__file__).resolve().parent
SKILL_REPO = Path(__file__).resolve().parents[2]  # raiz do repo do skill
GOLDEN = Path(os.environ.get("PM_BENCH_WORK", "/tmp/pm-bench")) / "golden"
RUNS = Path(os.environ.get("PM_BENCH_WORK", "/tmp/pm-bench")) / "runs"
SYS = (B / "seed" / "benchmark-system.md").read_text()

CONFIGS = {
    "fable-high":   ["--model", "claude-fable-5-1", "--effort", "high"],
    "opus-xhigh":   ["--model", "claude-opus-5-5", "--effort", "xhigh"],
    "opus-medium":  ["--model", "claude-opus-5-5", "--effort", "medium"],
    "sonnet-high":  ["--model", "claude-sonnet-5", "--effort", "high"],
    "haiku":        ["--model", "claude-haiku-4-5"],
}
TIMEOUT = {"execute": 150 * 60, "break": 60 * 60}
BUDGET = {"execute": "80", "break": "25"}


def sh(cmd, cwd, check=True):
    return subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True, text=True, check=check)


def make_base(skill_ref="HEAD"):
    base = GOLDEN / "00-base"
    if base.exists():
        shutil.rmtree(base)
    base.mkdir(parents=True)
    sh("git init -q -b main && git config user.email bench@local && git config user.name bench", base)
    shutil.copy(B / "seed" / "BENCHMARK_ANSWERS.md", base / "BENCHMARK_ANSWERS.md")
    (base / ".gitignore").write_text("node_modules/\ndata/\n.bench/\n")
    sk = base / ".claude" / "skills" / "project-maker"
    sk.mkdir(parents=True)
    sh(f"git -C {SKILL_REPO} archive {skill_ref} | tar -x -C {sk}", base)
    sh("git add -A && git commit -qm 'chore: base do benchmark'", base)
    return base


def copy_snapshot(src, dst):
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst, symlinks=True)


def extract_handoff(text):
    """Pega o primeiro bloco de código depois de 'Próximo passo' e extrai o comando /project-maker."""
    m = re.search(r"Próximo passo(.*)", text or "", re.S)
    seg = m.group(1) if m else (text or "")
    cm = re.search(r"```[a-z]*\n(.*?)```", seg, re.S)
    cmd = cm.group(1).strip().splitlines()[0].strip() if cm else None
    return cmd


def handoff_check(cmd, work):
    if not cmd:
        return {"cmd": None, "ok": False, "why": "sem bloco de handoff"}
    if re.search(r"\[|NNN|\.\.\.|<", cmd):
        return {"cmd": cmd, "ok": False, "why": "placeholder"}
    parts = cmd.split()
    paths = [p.strip('"\'') for p in parts[2:] if "/" in p or p.endswith(".md")]
    missing = [p for p in paths if not (work / p).exists()]
    return {"cmd": cmd, "ok": not missing, "why": f"path inexistente: {missing}" if missing else "ok"}


def agents_model(model):
    """prep: reescreve o model: do frontmatter dos agentes registrados em .claude/agents/."""
    def _p(work):
        for f in (work / ".claude" / "agents").glob("*.md"):
            t = f.read_text()
            t = re.sub(r"^model: .*$", f"model: {model}", t, count=1, flags=re.M)
            f.write_text(t)
        sh("git add -A && git -c user.email=bench@local -c user.name=bench commit -qm 'bench: agents model' --allow-empty", work, check=False)
    return _p


def quota_ok():
    """Sonda barata: True se o plano aceita chamada agora."""
    try:
        r = subprocess.run(["claude", "-p", "Responda só: ok", "--model", "claude-sonnet-5", "--output-format", "json",
                            "--no-session-persistence", "--setting-sources", "project", "--strict-mcp-config"],
                           stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=120, cwd=str(B))
        d = json.loads(r.stdout)
        return not re.search(r"hit your .*limit", d.get("result") or "", re.I)
    except Exception:
        return False


_quota_lock = __import__("threading").Lock()


def wait_for_quota(poll=600, max_wait=6 * 3600):
    with _quota_lock:
        waited = 0
        while not quota_ok():
            print(json.dumps({"quota": "limited", "waited_s": waited}), flush=True)
            time.sleep(poll)
            waited += poll
            if waited > max_wait:
                raise RuntimeError("quota não voltou")


def run_with_retry(stage, cfg, src, out, arg="", prep=None, max_retries=40):
    """Roda; se bateu limite do plano, espera a cota voltar (sondando a cada 10 min) e refaz a etapa do zero."""
    for attempt in range(max_retries + 1):
        wait_for_quota()
        s = run_stage(stage, cfg, src, out, arg, prep=prep)
        if not s.get("rate_limited"):
            return s
        (out.parent / f"{out.name}.ratelimit-{attempt}.md").write_text((out / "final.md").read_text())
        print(json.dumps({"rate_limited": True, "stage": stage, "config": cfg, "attempt": attempt}), flush=True)
    return s


def run_stage(stage, cfg, src, out, arg="", extra_env=None, prep=None):
    out.mkdir(parents=True, exist_ok=True)
    work = out / "work"
    copy_snapshot(src, work)
    if prep:
        prep(work)
    start_sha = sh("git rev-parse HEAD", work).stdout.strip()
    prompt = f"/project-maker {stage} {arg}".strip()
    cmd = ["claude", "-p", prompt, *CONFIGS[cfg],
           "--setting-sources", "project", "--strict-mcp-config",
           "--settings", json.dumps({"language": "portuguese"}),
           "--append-system-prompt", SYS,
           "--permission-mode", "bypassPermissions",
           "--output-format", "stream-json", "--verbose",
           "--no-session-persistence",
           "--max-budget-usd", BUDGET.get(stage, "15")]
    env = dict(os.environ, **(extra_env or {}))
    t0 = time.time()
    with open(out / "transcript.jsonl", "w") as f:
        try:
            p = subprocess.run(cmd, cwd=work, stdout=f, stderr=subprocess.PIPE, text=True,
                               timeout=TIMEOUT.get(stage, 45 * 60), env=env)
            rc, err = p.returncode, p.stderr
        except subprocess.TimeoutExpired:
            rc, err = "timeout", ""
    wall = time.time() - t0
    result = None
    for line in (out / "transcript.jsonl").read_text().splitlines():
        try:
            ev = json.loads(line)
        except Exception:
            continue
        if ev.get("type") == "result":
            result = ev
    # captura estado final (commit de tudo que ficou fora de commit)
    sh("git add -A && git -c user.email=bench@local -c user.name=bench commit -qm 'bench: estado final' --allow-empty", work, check=False)
    diff_stat = sh(f"git diff --stat {start_sha} HEAD", work, check=False).stdout
    (out / "diff.patch").write_text(sh(f"git diff {start_sha} HEAD", work, check=False).stdout)
    (out / "diff_stat.txt").write_text(diff_stat)
    text = (result or {}).get("result", "")
    (out / "final.md").write_text(text or "")
    hand = handoff_check(extract_handoff(text), work)
    mu = (result or {}).get("modelUsage", {})
    utils = []
    for line in (out / "transcript.jsonl").read_text().splitlines():
        if '"rate_limit_event"' in line:
            try:
                w = json.loads(line)["rate_limit_info"].get("unifiedWindows", {}).get("five_hour", {})
                if w.get("utilization") is not None: utils.append(w["utilization"])
            except Exception:
                pass
    rate_limited = bool(re.search(r"hit your (session|usage|weekly)? ?limit|usage limit", text or "", re.I)) or bool(re.search(r"hit your .*limit", (err or ""), re.I))
    summary = {
        "rate_limited": rate_limited,
        "util5h_first": utils[0] if utils else None, "util5h_last": utils[-1] if utils else None,
        "stage": stage, "config": cfg, "arg": arg, "rc": rc, "stderr_tail": (err or "")[-800:],
        "wall_s": round(wall, 1),
        "duration_ms": (result or {}).get("duration_ms"),
        "cost_usd": (result or {}).get("total_cost_usd"),
        "num_turns": (result or {}).get("num_turns"),
        "is_error": (result or {}).get("is_error"),
        "subtype": (result or {}).get("subtype"),
        "output_tokens": sum(v.get("outputTokens", 0) for v in mu.values()),
        "input_tokens_total": sum(v.get("inputTokens", 0) + v.get("cacheReadInputTokens", 0) + v.get("cacheCreationInputTokens", 0) for v in mu.values()),
        "model_usage": {k: {"cost": round(v.get("costUSD", 0), 4), "out": v.get("outputTokens"), "in": v.get("inputTokens", 0) + v.get("cacheReadInputTokens", 0) + v.get("cacheCreationInputTokens", 0)} for k, v in mu.items()},
        "subagents": (result or {}).get("subagent_stats"),
        "handoff": hand,
        "files_changed": len([l for l in diff_stat.splitlines() if "|" in l]),
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=1, ensure_ascii=False))
    return summary


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd")
    ap.add_argument("--stage")
    ap.add_argument("--src")
    ap.add_argument("--arg", default="")
    ap.add_argument("--configs", default=",".join(CONFIGS))
    ap.add_argument("--tag", default="")
    ap.add_argument("--par", type=int, default=5)
    ap.add_argument("--reps", type=int, default=1)
    a = ap.parse_args()
    if a.cmd == "base":
        print(make_base())
    elif a.cmd == "matrix":
        src = Path(a.src)
        jobs = []
        with ThreadPoolExecutor(max_workers=a.par) as ex:
            for cfg in a.configs.split(","):
                for r in range(a.reps):
                    out = RUNS / f"{a.stage}{a.tag}" / f"{cfg}-r{r+1}"
                    jobs.append(ex.submit(run_stage, a.stage, cfg, src, out, a.arg))
            for j in as_completed(jobs):
                s = j.result()
                print(json.dumps({k: s[k] for k in ("stage", "config", "rc", "wall_s", "cost_usd", "num_turns", "output_tokens", "handoff")}, ensure_ascii=False), flush=True)
