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


import os
from google import genai
from django.conf import settings

def suggest_project_description(*, title: str, category: str, budget: int, timeline_days: int, required_skills: list[str]) -> str:
    skills = ", ".join(required_skills) if required_skills else "relevant technical skills"
    
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        # Fallback if no API key is provided
        return (
            f"We are looking for a {category} specialist to deliver '{title}'. "
        )
    
    client = genai.Client(api_key=api_key)
    prompt = (
        f"Generate a professional project description for a freelance platform.\n"
        f"Title: {title}\n"
        f"Category: {category}\n"
        f"Budget: ${budget}\n"
        f"Timeline: {timeline_days} days\n"
        f"Required Skills: {skills}\n"
        f"Format the output entirely in clean Markdown."
    )
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Failed to generate description: {str(e)}"
            f"The expected budget is around {budget} MNT with a delivery timeline of {timeline_days} days. "
            f"Key requirements include {skills}, clear communication, and production-ready deliverables. "
            "Please include a concise implementation plan, milestone breakdown, and similar past work references in your proposal."
        )

    try:
        genai.configure(api_key=api_key)
        # Using gemini-1.5-flash as the default models for simple text tasks
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            f"Act as a professional IT project manager. Write a concise, professional project description for a freelance IT marketplace. "
            f"The title is '{title}', category is '{category}'. The budget is {budget} MNT, timeline is {timeline_days} days. "
            f"Required skills: {skills}. Keep it under 150 words. Do not use markdown headers, just plain text with line breaks."
        )
        response = model.generate_content(prompt)
        if response.text:
            return response.text.strip()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Gemini AI generation failed: %s", e)
        
    # Fallback if generation fails
    return (
        f"We are looking for a {category} specialist to deliver '{title}'. "
        f"The expected budget is around {budget} MNT with a delivery timeline of {timeline_days} days. "
        f"Key requirements include {skills}, clear communication, and production-ready deliverables. "
        "Please include a concise implementation plan, milestone breakdown, and similar past work references in your proposal."
    )
