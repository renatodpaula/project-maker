#!/usr/bin/env python3
"""project-maker — sensores determinísticos de estado. Só stdlib, só leitura.

Rode na raiz do projeto (ou passe --root):

  pm.py next [--expect "<comando>"]   valida o Next command do STATE.md: sem placeholder, paths existem
  pm.py status                        sprints, issues, UAT e SECURITY lidos do disco
  pm.py coverage [spec]               todo REQ-N da spec tem issue que o implementa?
  pm.py waves <sprint.md>             issues da mesma wave tocam o mesmo arquivo?
  pm.py paths [spec]                  onde gravar sprints e issues dessa spec; próximos números de SPRINT e FEAT

Dois layouts convivem no mesmo projeto. Plano: Spec.md (ou docs/specs/FEAT-NNN-x.md) com docs/sprints/ e
docs/issues/. Por feature: docs/specs/FEAT-NNN-x/spec.md com sprints/ e issues/ dentro da pasta.

Exit 0 = ok. Exit 1 = o sensor reprovou (motivo em uma linha no stderr). Exit 2 = uso errado.
Os modos do skill rodam estes comandos em vez de conferir o estado "de cabeça".
"""
import argparse
import os
import re
import sys
from pathlib import Path

PLACEHOLDER = re.compile(r"\[[^\]]*\]|<[^>]*>|\bNNN\b|\.\.\.|…")
STATUSES = ("pending-review", "in-progress", "blocked", "awaiting-human", "planned", "done", "draft")
ALIASES = {"entregue": "done", "pendente": "planned", "em progresso": "in-progress",
           "✅": "done", "🔄": "in-progress", "⏸": "pending-review", "🔲": "planned"}


def fail(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def read(p):
    try:
        return p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def status_of(text):
    """Status de um sprint/issue a partir da linha **Status**. Template não preenchido (a | b | c) = unknown."""
    m = re.search(r"^\*\*Status\*\*:\s*(.+)$", text, re.M)
    if not m:
        return "unknown"
    line = m.group(1).lower()
    if "|" in line:
        return "unknown"
    for s in STATUSES:
        if s in line:
            return s
    for k, v in ALIASES.items():
        if k in line:
            return v
    return "unknown"


def frontmatter(text):
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    out = {}
    for line in (m.group(1).splitlines() if m else []):
        if ":" in line and not line.startswith((" ", "#")):
            k, v = line.split(":", 1)
            out[k.strip()] = v.split("#")[0].strip().strip("\"'")
    return out


SKIP_DIRS = {".git", "node_modules", ".claude", ".pm-autopilot"}


def walk_md(root):
    """Todo .md do projeto. Não desce em SKIP_DIRS nem em repo ou worktree aninhado (pasta com .git próprio)."""
    for base, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS and not os.path.exists(os.path.join(base, d, ".git")))
        for f in sorted(files):
            if f.endswith(".md"):
                yield Path(base) / f


def sprints(root):
    found = [p for p in walk_md(root)
             if p.name.startswith("SPRINT-") and not re.search(r"-(uat|SECURITY)\.md$", p.name)]
    return sorted(found, key=lambda p: p.name)


def specs(root):
    """Specs do projeto: Spec.md na raiz, docs/specs/FEAT-*.md (layout plano) e docs/specs/*/spec.md (pasta por feature)."""
    d = root / "docs" / "specs"
    flat = [p for p in sorted(d.glob("*.md")) if not p.name.endswith(".context.md")]
    return [p for p in [root / "Spec.md"] + flat + sorted(d.glob("*/spec.md")) if p.exists()]


def feature_dir(root, spec):
    """Pasta da feature quando a spec é <pasta>/spec.md fora da raiz; None no layout plano."""
    return spec.parent if spec.name.lower() == "spec.md" and spec.parent != root else None


def sprint_issues(root, sprint):
    """Paths de issue citados no sprint, na ordem, existentes ou não."""
    seen, out = set(), []
    for ref in re.findall(r"`([^`\n]+\.md)`", read(sprint)):
        if "SPRINT-" in ref or ref in seen:
            continue
        seen.add(ref)
        out.append(root / ref)
    return out


def issue_files(text):
    """Paths em backticks nas seções 'Arquivos a criar' e 'Arquivos a modificar' de uma issue."""
    files = set()
    for m in re.finditer(r"^## Arquivos a (?:criar|modificar)\s*\n(.*?)(?=^## |^---\s*$|\Z)", text, re.M | re.S):
        for line in m.group(1).splitlines():
            b = re.match(r"\s*[-*]\s*`([^`]+)`", line)
            if b and not PLACEHOLDER.search(b.group(1)) and not b.group(1).startswith("path/"):
                files.add(b.group(1))
    return files


def enriched(issue):
    return bool(issue_files(read(issue)))


def next_command(root):
    m = re.search(r"\*\*Next command\*\*:\s*`([^`]*)`", read(root / "STATE.md"))
    return m.group(1).strip() if m else None


def check_command(root, cmd):
    """None se o comando é executável agora; senão o motivo."""
    if not cmd:
        return "STATE.md sem Next command"
    if not cmd.startswith("/project-maker "):
        return f"Next command não é do skill: {cmd}"
    quoted = re.sub(r"\"[^\"]*\"|'[^']*'", "", cmd)
    if PLACEHOLDER.search(quoted):
        return f"placeholder no comando: {cmd}"
    parts = quoted.split()
    mode = parts[1] if len(parts) > 1 else ""
    paths = [p for p in parts[2:] if not p.startswith("--") and ("/" in p or p.endswith(".md"))]
    missing = [p for p in paths if not (root / p).exists()]
    if missing:
        return f"path inexistente: {', '.join(missing)}"
    if mode in ("execute", "verify", "secure", "ship", "plan") and not paths and len(sprints(root)) != 1:
        return f"/{mode} sem alvo num projeto com {len(sprints(root))} sprints"
    return None


def cmd_next(a):
    cmd = next_command(a.root)
    why = check_command(a.root, cmd)
    if why:
        fail(why)
    if a.expect is not None and a.expect.strip() != cmd:
        fail(f"Next command do STATE.md difere do esperado: STATE={cmd!r} esperado={a.expect.strip()!r}")
    print(cmd)


def cmd_status(a):
    sp = sprints(a.root)
    if not sp:
        print("nenhum sprint no disco")
    for s in sp:
        issues = sprint_issues(a.root, s)
        counts = {}
        for i in issues:
            st = status_of(read(i)) if i.exists() else "missing"
            counts[st] = counts.get(st, 0) + 1
        plan = sum(1 for i in issues if i.exists() and enriched(i))
        extra = []
        base = re.match(r"(SPRINT-\d+)", s.name)
        for suffix, key in (("uat", "status"), ("SECURITY", "threats_open")):
            f = s.parent / f"{base.group(1)}-{suffix}.md" if base else None
            if f and f.exists():
                extra.append(f"{suffix.lower()}:{frontmatter(read(f)).get(key, '?')}")
        detail = " ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        print(f"{s.relative_to(a.root)}  [{status_of(read(s))}]  issues={len(issues)} planejadas={plan} {detail} {' '.join(extra)}".rstrip())
    cmd = next_command(a.root)
    why = check_command(a.root, cmd)
    print(f"next: {cmd or '-'}" + (f"  (INVÁLIDO: {why})" if why else ""))


def find_spec(root, arg):
    if arg:
        p = root / arg
        return p if p.exists() else fail(f"spec inexistente: {arg}")
    cands = specs(root)
    if len(cands) != 1:
        fail(f"{len(cands)} specs no disco; passe o path" if cands else "nenhuma spec no disco")
    return cands[0]


def cmd_coverage(a):
    spec = find_spec(a.root, a.spec)
    reqs = set(re.findall(r"\bREQ-\d+\b", read(spec)))
    if not reqs:
        fail(f"{spec.relative_to(a.root)} não tem nenhum REQ-N")
    implemented = {}
    # layout por feature: só as issues da pasta da spec; layout plano: todas, menos as de pastas de feature
    own = feature_dir(a.root, spec)
    others = [d for d in (feature_dir(a.root, s) for s in specs(a.root)) if d]
    for issue in walk_md(a.root):
        if "issues" not in issue.relative_to(a.root).parts:
            continue
        if (own not in issue.parents) if own else any(d in issue.parents for d in others):
            continue
        m = re.search(r"^\**Implements\**:\s*(.+)$", read(issue), re.M)
        for r in re.findall(r"REQ-\d+", m.group(1) if m else ""):
            implemented.setdefault(r, []).append(issue.name)
    missing = sorted(reqs - set(implemented), key=lambda r: int(r[4:]))
    unknown = sorted(set(implemented) - reqs, key=lambda r: int(r[4:]))
    print(f"{len(reqs) - len(missing)}/{len(reqs)} REQs com issue")
    if unknown:
        print(f"issues citam REQ que não existe na spec: {', '.join(unknown)}")
    if missing or unknown:
        fail(f"REQ sem issue: {', '.join(missing) or '-'}; REQ inexistente citado: {', '.join(unknown) or '-'}")


def cmd_waves(a):
    sprint = a.root / a.sprint
    text = read(sprint)
    if not text:
        fail(f"sprint inexistente: {a.sprint}")
    issues = [i for i in sprint_issues(a.root, sprint) if i.exists()]
    m = re.search(r"^## Waves\s*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    wave_lines = re.findall(r"^\s*Wave\s+(\d+)[^:]*:\s*(.+)$", m.group(1) if m else "", re.M)
    if not wave_lines:
        fail(f"{a.sprint} não tem seção ## Waves legível (linhas 'Wave N: a, b')")
    placed, collisions = set(), []
    for n, body in wave_lines:
        owners = {}
        for ref in re.split(r"[,;]", body.split("←")[0]):
            ref = ref.strip().strip("`")
            if not ref:
                continue
            hits = [i for i in issues if ref in str(i.relative_to(a.root)) or i.name.startswith(ref.split("/")[-1] + "-")]
            hits = [i for i in hits if ref.split("/")[0] in i.parts or "/" not in ref]
            if len(hits) != 1:
                fail(f"Wave {n}: '{ref}' casa com {len(hits)} issues do sprint")
            placed.add(hits[0])
            for f in issue_files(read(hits[0])):
                owners.setdefault(f, []).append(hits[0].name)
        collisions += [f"Wave {n}: {f} ← {', '.join(o)}" for f, o in sorted(owners.items()) if len(o) > 1]
    orphans = [i.name for i in issues if i not in placed]
    for c in collisions:
        print(c)
    if orphans:
        print(f"issues do sprint fora de qualquer wave: {', '.join(orphans)}")
    if collisions or orphans:
        fail(f"{len(collisions)} colisão(ões) de arquivo na mesma wave; {len(orphans)} issue(s) sem wave")
    unplanned = [i.name for i in issues if not enriched(i)]
    print(f"{len(wave_lines)} waves sem colisão" + (f" (sem lista de arquivos, não conferidas: {', '.join(unplanned)})" if unplanned else ""))


def next_number(names, prefix):
    nums = [int(m.group(1)) for m in (re.match(prefix + r"-(\d+)", n) for n in names) if m]
    return f"{max(nums, default=0) + 1:03d}"


def cmd_paths(a):
    all_sprints = sprints(a.root)
    if a.spec:
        spec = find_spec(a.root, a.spec)
        own = feature_dir(a.root, spec)
        if own:
            sprint_dir = own / "sprints"
        else:
            # convenção existente vence: a pasta onde os sprints do layout plano já estão
            others = [d for d in (feature_dir(a.root, s) for s in specs(a.root)) if d]
            flat = [s for s in all_sprints if not any(d in s.parents for d in others)]
            sprint_dir = flat[-1].parent if flat else a.root / "docs" / "sprints"
        print(f"layout: {'feature' if own else 'flat'}")
        print(f"spec: {spec.relative_to(a.root)}")
        print(f"sprints: {sprint_dir.relative_to(a.root)}")
        print(f"issues: {(sprint_dir.parent / 'issues').relative_to(a.root)}")
    spec_dir = a.root / "docs" / "specs"
    print(f"next_sprint: SPRINT-{next_number([s.name for s in all_sprints], 'SPRINT')}")
    print(f"next_feat: FEAT-{next_number([p.name for p in spec_dir.glob('FEAT-*')], 'FEAT')}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", type=Path, default=Path.cwd())
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("next"); n.add_argument("--expect"); n.set_defaults(fn=cmd_next)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    c = sub.add_parser("coverage"); c.add_argument("spec", nargs="?"); c.set_defaults(fn=cmd_coverage)
    w = sub.add_parser("waves"); w.add_argument("sprint"); w.set_defaults(fn=cmd_waves)
    p = sub.add_parser("paths"); p.add_argument("spec", nargs="?"); p.set_defaults(fn=cmd_paths)
    a = ap.parse_args()
    a.root = a.root.resolve()
    a.fn(a)


if __name__ == "__main__":
    main()
