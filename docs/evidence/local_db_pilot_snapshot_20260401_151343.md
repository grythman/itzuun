# Local DB Pilot Snapshot

- Captured at (UTC): 2026-04-01T15:13:43Z
- Environment: local `/root/itzuun` database

## Funded Escrows (latest 5)
Command:
`cd /root/itzuun/backend && ../.venv/bin/python manage.py shell -c "from apps.payments.models import Escrow; rows=list(Escrow.objects.filter(status='funded').order_by('-created_at')[:5]); print([r.project_id for r in rows])"`

Output:
`[]`

## Completed Projects (latest 3)
Command:
`cd /root/itzuun/backend && ../.venv/bin/python manage.py shell -c "from apps.projects.models import Project; rows=list(Project.objects.filter(status='completed').order_by('-updated_at')[:3]); print([p.id for p in rows])"`

Output:
`[]`

## Resolved Dispute (latest)
Command:
`cd /root/itzuun/backend && ../.venv/bin/python manage.py shell -c "from apps.payments.models import Dispute; d=Dispute.objects.filter(resolved_at__isnull=False).order_by('-resolved_at').first(); print({'id': getattr(d,'id',None), 'note': getattr(d,'note',None), 'resolved_at': str(getattr(d,'resolved_at',None))})"`

Output:
`{'id': None, 'note': None, 'resolved_at': 'None'}`

## Ledger Entries (latest 20)
Command:
`cd /root/itzuun/backend && ../.venv/bin/python manage.py shell -c "from apps.payments.models import LedgerEntry; rows=list(LedgerEntry.objects.order_by('-created_at').values('id','escrow_id','escrow__project_id','entry_type','amount')[:20]); print(rows)"`

Output:
`[]`
