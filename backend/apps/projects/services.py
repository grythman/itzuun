"""Project domain services."""
from django.db import transaction

from common.exceptions import DomainError
from common.state_guards import guard_project_transition

from .models import Project, Proposal


@transaction.atomic
def select_freelancer(project: Project, proposal: Proposal) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise DomainError("Project is not open")
    guard_project_transition(project.status, Project.STATUS_IN_PROGRESS)
    project.status = Project.STATUS_IN_PROGRESS
    project.selected_proposal = proposal
    proposal.status = Proposal.STATUS_ACCEPTED
    proposal.save(update_fields=["status"])
    project.save(update_fields=["status", "selected_proposal"])
    return project


def close_project(project: Project) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise DomainError("Project is not open")
    guard_project_transition(project.status, Project.STATUS_CLOSED_REFUNDED)
    project.status = Project.STATUS_CLOSED_REFUNDED
    project.save(update_fields=["status"])
    return project
