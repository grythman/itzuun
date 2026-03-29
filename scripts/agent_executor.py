#!/usr/bin/env python3
import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


P = Path("/root/itzuun/agent_bridge.json")
INT = 5
MAX_OUT = 20000
MAX_RETRY = 3


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def rd() -> Dict[str, Any]:
    if not P.exists():
        return {
            "status": "idle",
            "task": None,
            "feedback": "",
            "updated_at": now(),
        }
    try:
        return json.loads(P.read_text(encoding="utf-8"))
    except Exception:
        return {
            "status": "error",
            "task": None,
            "feedback": "agent_bridge.json parse error",
            "updated_at": now(),
        }


def wr(d: Dict[str, Any]) -> None:
    d["updated_at"] = now()
    t = P.with_suffix(".tmp")
    t.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(t, P)


def clip(s: str) -> str:
    if len(s) <= MAX_OUT:
        return s
    return s[:MAX_OUT] + "\n...[truncated]"


def run_cmd(c: str, wd: str, to: int) -> Dict[str, Any]:
    try:
        p = subprocess.run(
            c,
            shell=True,
            cwd=wd,
            text=True,
            capture_output=True,
            timeout=to,
        )
        return {
            "ok": p.returncode == 0,
            "code": p.returncode,
            "out": clip(p.stdout or ""),
            "err": clip(p.stderr or ""),
        }
    except subprocess.TimeoutExpired as e:
        return {
            "ok": False,
            "code": 124,
            "out": clip((e.stdout or "") if isinstance(e.stdout, str) else ""),
            "err": clip((e.stderr or "") if isinstance(e.stderr, str) else "timeout"),
        }
    except Exception as e:
        return {"ok": False, "code": 1, "out": "", "err": clip(str(e))}


def get_commands(d: Dict[str, Any]) -> Dict[str, Any]:
    t = d.get("task")
    if isinstance(t, dict):
        c = (t.get("command") or "").strip()
        v = (t.get("validate_command") or "").strip()
        wd = t.get("cwd") or "/root/itzuun"
        to = int(t.get("timeout_sec") or 1200)
        return {"cmd": c, "vld": v, "wd": wd, "to": to}
    if isinstance(t, str) and t.strip():
        wd = "/root/itzuun"
        to = 7200
        c = f"codex exec {json.dumps(t.strip())}"
        return {"cmd": c, "vld": "", "wd": wd, "to": to}
    return {"cmd": "", "vld": "", "wd": "/root/itzuun", "to": 1200}


def run_task(d: Dict[str, Any]) -> Dict[str, Any]:
    cfg = get_commands(d)
    cmd = cfg["cmd"]
    vld = cfg["vld"]
    wd = cfg["wd"]
    to = cfg["to"]

    d["status"] = "running"
    d["iteration"] = 0
    d["feedback"] = ""
    wr(d)

    if not cmd:
        d["status"] = "error"
        d["feedback"] = "task.command is required"
        return d

    last = ""
    for i in range(1, MAX_RETRY + 1):
        d["iteration"] = i
        wr(d)
        r = run_cmd(cmd, wd, to)
        ok = r["ok"]
        if ok and vld:
            vr = run_cmd(vld, wd, to)
            ok = vr["ok"]
            if not ok:
                r = {
                    "ok": False,
                    "code": vr["code"],
                    "out": (r["out"] + "\n" + vr["out"]).strip(),
                    "err": ("validate failed\n" + vr["err"]).strip(),
                }
        if ok:
            d["status"] = "completed"
            d["feedback"] = ""
            d["result"] = {
                "exit_code": r["code"],
                "stdout": r["out"],
                "stderr": r["err"],
                "finished_at": now(),
            }
            return d
        last = (r["err"] or r["out"] or f"exit_code={r['code']}").strip()

    d["status"] = "error"
    d["feedback"] = clip(last)
    d["result"] = {"finished_at": now()}
    return d


def main() -> None:
    while True:
        try:
            d = rd()
            s = d.get("status")
            if s == "pending":
                d = run_task(d)
                wr(d)
            elif s is None:
                d["status"] = "idle"
                d["feedback"] = d.get("feedback", "")
                wr(d)
        except Exception:
            pass
        time.sleep(INT)


if __name__ == "__main__":
    main()
