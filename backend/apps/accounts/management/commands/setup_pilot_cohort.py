import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User
from apps.projects.models import Project


def _parse_csv(raw: str) -> list[str]:
    if not raw:
        return []
    return [chunk.strip() for chunk in raw.split(",") if chunk.strip()]


class Command(BaseCommand):
    help = "Validate and bootstrap pilot cohort (clients, freelancers, projects) from args or JSON input."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clients", default="", help="Comma-separated client emails"
        )
        parser.add_argument(
            "--freelancers", default="", help="Comma-separated freelancer emails"
        )
        parser.add_argument(
            "--projects", default="", help="Comma-separated project IDs"
        )
        parser.add_argument(
            "--input-json",
            default="",
            help="Path to JSON payload with clients/freelancers/projects",
        )
        parser.add_argument(
            "--output", default="", help="Optional path to write validation report JSON"
        )
        parser.add_argument(
            "--strict", action="store_true", help="Fail if any listed record is missing"
        )

    def handle(self, *args, **options):
        clients = _parse_csv(options["clients"])
        freelancers = _parse_csv(options["freelancers"])
        projects = _parse_csv(options["projects"])

        input_json = options.get("input_json") or ""
        if input_json:
            payload = self._load_input_payload(input_json)
            clients = payload.get("clients", clients)
            freelancers = payload.get("freelancers", freelancers)
            projects = payload.get("projects", projects)

        project_ids = self._coerce_project_ids(projects)
        report = self._build_report(clients, freelancers, project_ids)

        if options.get("strict") and report["summary"]["missing_total"] > 0:
            raise CommandError(
                "Pilot cohort validation failed in strict mode: missing records found"
            )

        output_path = options.get("output") or ""
        if output_path:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(report, indent=2), encoding="utf-8")

        self.stdout.write(json.dumps(report, indent=2))

    def _load_input_payload(self, filepath: str) -> dict:
        path = Path(filepath)
        if not path.exists():
            raise CommandError(f"Input JSON not found: {filepath}")
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid input JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise CommandError("Input JSON must be an object")
        return payload

    def _coerce_project_ids(self, raw_projects: list[str]) -> list[int]:
        project_ids: list[int] = []
        for item in raw_projects:
            try:
                project_ids.append(int(item))
            except (TypeError, ValueError) as exc:
                raise CommandError(f"Invalid project id: {item}") from exc
        return project_ids

    def _build_report(
        self, clients: list[str], freelancers: list[str], project_ids: list[int]
    ) -> dict:
        existing_clients = set(
            User.objects.filter(email__in=clients, role=User.ROLE_CLIENT).values_list(
                "email", flat=True
            )
        )
        existing_freelancers = set(
            User.objects.filter(
                email__in=freelancers, role=User.ROLE_FREELANCER
            ).values_list("email", flat=True)
        )
        existing_projects = set(
            Project.objects.filter(id__in=project_ids).values_list("id", flat=True)
        )

        missing_clients = sorted(
            [email for email in clients if email not in existing_clients]
        )
        missing_freelancers = sorted(
            [email for email in freelancers if email not in existing_freelancers]
        )
        missing_projects = sorted(
            [pid for pid in project_ids if pid not in existing_projects]
        )

        return {
            "phase": "Launch Readiness",
            "task": "pilot cohort selection bootstrap",
            "input": {
                "clients": clients,
                "freelancers": freelancers,
                "projects": project_ids,
            },
            "matched": {
                "clients": sorted(existing_clients),
                "freelancers": sorted(existing_freelancers),
                "projects": sorted(existing_projects),
            },
            "missing": {
                "clients": missing_clients,
                "freelancers": missing_freelancers,
                "projects": missing_projects,
            },
            "summary": {
                "client_total": len(clients),
                "freelancer_total": len(freelancers),
                "project_total": len(project_ids),
                "missing_total": len(missing_clients)
                + len(missing_freelancers)
                + len(missing_projects),
            },
        }
