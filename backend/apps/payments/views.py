
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.idempotency import execute_idempotent
from apps.payments.models import Dispute
from apps.payments.permissions import IsProjectOwnerForPayment
from apps.payments.serializers import EscrowSerializer
from apps.payments.services import confirm_completion, deposit_to_escrow
from apps.projects.models import Project


class ProjectEscrowDepositView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        def _executor():
            escrow = deposit_to_escrow(project, actor=request.user, amount=project.selected_proposal.price)
            return EscrowSerializer(escrow).data, status.HTTP_201_CREATED

        return execute_idempotent(request, _executor)


class ProjectConfirmCompletionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        # 1. ХАМГИЙН ТҮРҮҮНД: Dispute байгаа эсэхийг шалгах (resolved_at ашиглан)
        if Dispute.objects.filter(project=project, resolved_at__isnull=True).exists():
            return Response(
                {"error": "Project has an unresolved dispute."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. ДАРАА НЬ: Хэрэв аль хэдийн дууссан бол idempotency хариу буцаах
        if project.status == Project.STATUS_COMPLETED:
            return Response({"status": "completed"}, status=status.HTTP_200_OK)

        # 3. ЭЦЭСТ НЬ: Service-ийг дуудах
        def _executor():
            escrow = confirm_completion(project, approved_by=request.user)
            return {"status": "completed"}, status.HTTP_200_OK

        return execute_idempotent(request, _executor)


class ProjectDisputeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectOwnerForPayment]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        # ... (implementation not shown)
        return Response(status=status.HTTP_201_CREATED)
