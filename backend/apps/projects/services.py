"""Project domain services."""
from django.db import transaction

from .models import Project, Proposal


@transaction.atomic
def select_freelancer(project: Project, proposal: Proposal) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise ValueError("Project is not open")
    project.status = Project.STATUS_IN_PROGRESS
    project.selected_proposal = proposal
    proposal.status = Proposal.STATUS_ACCEPTED
    proposal.save(update_fields=["status"])
    project.save(update_fields=["status", "selected_proposal"])
    return project


def close_project(project: Project) -> Project:
    if project.status != Project.STATUS_OPEN:
        raise ValueError("Project is not open")
    project.status = Project.STATUS_CLOSED_REFUNDED
    project.save(update_fields=["status"])
    return project
