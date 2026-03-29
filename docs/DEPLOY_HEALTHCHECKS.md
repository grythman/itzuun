# Deploy healthcheck playbook

## Top 1: Upstream bind mismatch (container re-IP)
- Fix: ensure service listens on 0.0.0.0 and nginx resolves service name or is restarted after deploy.
- Commands (fix):
```bash
# Next.js: bind 0.0.0.0
# in Dockerfile/entrypoint or package.json start: "next start -p 3000 -H 0.0.0.0"
export NEXT_HOST=0.0.0.0
npm run start -- -p 3000 --hostname 0.0.0.0

# Post-deploy (quick): refresh nginx DNS
docker compose -f docker-compose.prod.yml restart nginx
```
- Verify:
```bash
docker compose -f docker-compose.prod.yml exec web ss -ltnp | grep 3000
# expect: LISTEN 0.0.0.0:3000
```

## Top 2: nginx cached upstream IP after container recreate
- Fix A (fast): restart/reload nginx after deploy (done in CI retry patch). 
- Fix B (robust): enable resolver + variable proxy_pass in nginx config.
- Example nginx snippet (replace location / block):
```nginx
resolver 127.0.0.11 valid=30s;  # Docker DNS
set $upstream "web:3000";
location / {
    proxy_pass http://$upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
- Verify:
```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -t && docker compose -f docker-compose.prod.yml restart nginx
# trigger container replace -> nginx still reaches new IP
```

## Top 3: Health check follows redirect vs endpoint semantics
- Fix: use explicit health endpoint on both api and web; fallback to follow-redirects with timeout and accept common 3xx/2xx codes.
- Api (Django): add `/healthz` returning 200 JSON.
- Web (Next.js): static `/healthz` page returning 200 or use `/en` if app sets locale redirect.
- CI check (pattern):
```bash
# prefer direct endpoints; fallback to root with -L
c_api=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:8000/healthz || true)
c_web=$(curl -sS -L -o /dev/null -w "%{http_code}" https://itzuun.works/ || true)
```
- Verify:
```bash
curl -sS http://localhost:8000/healthz || echo fail
curl -sS -I https://itzuun.works/en | head -n 1
```

## Top 4: TLS/Proxy handshake or proxy env interference
- Fix: ensure certs valid (certbot) and CI runner not forcing proxy (https_proxy). Explicitly unset proxy for internal curl in CI: `env -u https_proxy -u http_proxy curl ...`.
- Commands:
```bash
# check cert
openssl s_client -connect itzuun.works:443 -servername itzuun.works </dev/null 2>/dev/null | openssl x509 -noout -dates

# CI curl without proxy
env -u https_proxy -u http_proxy curl -sS -o /dev/null -w "%{http_code}" https://itzuun.works/ || true
```

## Top 5: Firewall/host network blocking or port mapping error
- Fix: open ports 80/443, verify docker publish mapping and host firewall.
- Commands:
```bash
sudo ufw status || sudo iptables -L -n
docker compose -f docker-compose.prod.yml ps
ss -ltnp | egrep '(:80|:443)'
```

## Quick remediation checklist (CI-safe)
- After deploy (CI script):
```bash
dock_up() { docker compose -f docker-compose.prod.yml up -d --build --no-deps api web; }
dock_up
# retry loop already implemented in .github/workflows/ci.yml
docker compose -f docker-compose.prod.yml restart nginx || true
```

## Optional doc patch: add to repo
- File: `docs/DEPLOY_HEALTHCHECKS.md` (this file)
