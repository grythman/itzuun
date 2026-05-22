from django.conf import settings

from apps.projects.models import Project

from .models import ProjectFile, ProjectMessage


class MessageService:
    @staticmethod
    def send(project: Project, sender, text: str) -> ProjectMessage:
        """
        Sends a text message to a project's message thread.
        """
        return ProjectMessage.objects.create(
            project=project, sender=sender, type=ProjectMessage.TYPE_TEXT, text=text
        )

    @staticmethod
    def attach_file(
        project: Project, uploader, file, name: str, size: int
    ) -> ProjectFile:
        """
        Attaches a file to a project and creates a corresponding message.
        """
        project_file = ProjectFile.objects.create(
            project=project, uploader=uploader, file=file, name=name, size=size
        )
        # Also create a message of type 'file'
        ProjectMessage.objects.create(
            project=project,
            sender=uploader,
            type=ProjectMessage.TYPE_FILE,
            text=f"File attached: {name}",
        )
        return project_file
