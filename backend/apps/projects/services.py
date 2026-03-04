"""Project domain services."""
from django.db import transaction

from common.cache_utils import bump_admin_resource_version, bump_project_version
from common.exceptions import DomainError
from common.state_guards import guard_project_transition

from .models import Project, Proposal


@transaction.atomic
def select_freelancer(project: Project, proposal: Proposal) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise DomainError("Project is not open")
    if proposal.project_id != project.id:
        raise DomainError("Selected proposal must belong to the project")
    guard_project_transition(project.status, Project.STATUS_IN_PROGRESS)
    project.status = Project.STATUS_IN_PROGRESS
    project.selected_proposal = proposal
    proposal.status = Proposal.STATUS_ACCEPTED
    proposal.save(update_fields=["status"])
    project.save(update_fields=["status", "selected_proposal"])
    bump_project_version(project.id)
    bump_admin_resource_version("projects")
    return project


def close_project(project: Project) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise DomainError("Project is not open")
    guard_project_transition(project.status, Project.STATUS_CLOSED_REFUNDED)
    project.status = Project.STATUS_CLOSED_REFUNDED
    project.save(update_fields=["status"])
    bump_project_version(project.id)
    bump_admin_resource_version("projects")
    return project


def suggest_project_description(*, title: str, category: str, budget: int, timeline_days: int, required_skills: list[str]) -> str:
    skills = ", ".join(required_skills) if required_skills else "relevant technical skills"
    return (
        f"We are looking for a {category} specialist to deliver '{title}'. "
        f"The expected budget is around {budget} MNT with a delivery timeline of {timeline_days} days. "
        f"Key requirements include {skills}, clear communication, and production-ready deliverables. "
        "Please include a concise implementation plan, milestone breakdown, and similar past work references in your proposal."
    )
