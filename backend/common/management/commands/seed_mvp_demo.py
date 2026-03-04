from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.messaging.models import ProjectMessage
from apps.payments.models import Dispute, Escrow, LedgerEntry
from apps.projects.models import Project, Proposal
from apps.reviews.models import Review
from apps.profiles.models import Profile
from common.models import PlatformSetting


class Command(BaseCommand):
    help = "Seed ITZuun MVP demo users and data"

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            email="admin@itzuun.mn",
            defaults={"role": User.ROLE_ADMIN, "is_staff": True, "is_superuser": True, "is_verified": True},
        )
        admin.role = User.ROLE_ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.is_verified = True
        admin.set_password("Pass1234!")
        admin.save(update_fields=["role", "is_staff", "is_superuser", "is_verified", "password"])

        client, _ = User.objects.get_or_create(
            email="client@itzuun.mn",
            defaults={"role": User.ROLE_CLIENT, "is_verified": True},
        )
        client.role = User.ROLE_CLIENT
        client.is_verified = True
        client.set_password("Pass1234!")
        client.save(update_fields=["role", "is_verified", "password"])

        freelancer_pending, _ = User.objects.get_or_create(
            email="freelancer.pending@itzuun.mn",
            defaults={"role": User.ROLE_FREELANCER, "is_verified": False},
        )
        freelancer_pending.role = User.ROLE_FREELANCER
        freelancer_pending.is_verified = False
        freelancer_pending.set_password("Pass1234!")
        freelancer_pending.save(update_fields=["role", "is_verified", "password"])

        freelancer_verified, _ = User.objects.get_or_create(
            email="freelancer@itzuun.mn",
            defaults={"role": User.ROLE_FREELANCER, "is_verified": True},
        )
        freelancer_verified.role = User.ROLE_FREELANCER
        freelancer_verified.is_verified = True
        freelancer_verified.set_password("Pass1234!")
        freelancer_verified.save(update_fields=["role", "is_verified", "password"])

        Profile.objects.get_or_create(
            user=client,
            defaults={
                "full_name": "Demo Client",
                "bio": "MVP client account",
                "skills": ["product"],
                "hourly_rate": 0,
            },
        )
        Profile.objects.get_or_create(
            user=freelancer_pending,
            defaults={
                "full_name": "Pending Freelancer",
                "bio": "Awaiting admin verification",
                "skills": ["django"],
                "hourly_rate": 60000,
            },
        )
        Profile.objects.get_or_create(
            user=freelancer_verified,
            defaults={
                "full_name": "Verified Freelancer",
                "bio": "Ready for delivery",
                "skills": ["nextjs", "drf"],
                "hourly_rate": 85000,
            },
        )

        setting = PlatformSetting.get_solo()
        if setting.platform_fee_pct != 12:
            setting.platform_fee_pct = 12
            setting.save(update_fields=["platform_fee_pct"])

        open_project, _ = Project.objects.get_or_create(
            owner=client,
            title="MVP Landing Redesign",
            defaults={
                "description": "Need modern landing page and project list refinement.",
                "budget": 1500000,
                "timeline_days": 14,
                "category": "frontend",
                "status": Project.STATUS_OPEN,
            },
        )

        happy_project, _ = Project.objects.get_or_create(
            owner=client,
            title="Completed API Integration",
            defaults={
                "description": "API integration completed with escrow release.",
                "budget": 2000000,
                "timeline_days": 21,
                "category": "backend",
                "status": Project.STATUS_COMPLETED,
            },
        )
        happy_proposal, _ = Proposal.objects.get_or_create(
            project=happy_project,
            freelancer=freelancer_verified,
            defaults={
                "price": 1800000,
                "timeline_days": 18,
                "message": "Delivered production-ready integration",
                "status": Proposal.STATUS_ACCEPTED,
            },
        )
        if happy_project.selected_proposal_id != happy_proposal.id:
            happy_project.selected_proposal = happy_proposal
            happy_project.status = Project.STATUS_COMPLETED
            happy_project.save(update_fields=["selected_proposal", "status"])

        happy_escrow, _ = Escrow.objects.get_or_create(
            project=happy_project,
            defaults={"amount": happy_proposal.price, "status": Escrow.STATUS_RELEASED},
        )
        if happy_escrow.status != Escrow.STATUS_RELEASED:
            happy_escrow.amount = happy_proposal.price
            happy_escrow.status = Escrow.STATUS_RELEASED
            happy_escrow.save(update_fields=["amount", "status", "updated_at"])
        if not happy_escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).exists():
            LedgerEntry.objects.create(
                escrow=happy_escrow,
                entry_type=LedgerEntry.TYPE_DEPOSIT,
                amount=happy_proposal.price,
                note="Seed deposit",
            )
        if not happy_escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_FEE).exists():
            fee = int(happy_proposal.price * setting.platform_fee_pct / 100)
            LedgerEntry.objects.create(
                escrow=happy_escrow,
                entry_type=LedgerEntry.TYPE_FEE,
                amount=fee,
                note="Seed platform fee",
            )
        if not happy_escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_RELEASE).exists():
            fee = int(happy_proposal.price * setting.platform_fee_pct / 100)
            LedgerEntry.objects.create(
                escrow=happy_escrow,
                entry_type=LedgerEntry.TYPE_RELEASE,
                amount=happy_proposal.price - fee,
                note="Seed freelancer payout",
            )

        Review.objects.get_or_create(
            project=happy_project,
            reviewer=client,
            defaults={
                "reviewee": freelancer_verified,
                "rating": 5,
                "comment": "Demo completed project review",
            },
        )

        disputed_project, _ = Project.objects.get_or_create(
            owner=client,
            title="Disputed Mobile API",
            defaults={
                "description": "Project currently in dispute for admin resolution demo.",
                "budget": 1200000,
                "timeline_days": 12,
                "category": "mobile",
                "status": Project.STATUS_DISPUTED,
            },
        )
        disputed_proposal, _ = Proposal.objects.get_or_create(
            project=disputed_project,
            freelancer=freelancer_pending,
            defaults={
                "price": 1100000,
                "timeline_days": 10,
                "message": "Awaiting verification and dispute handling",
                "status": Proposal.STATUS_ACCEPTED,
            },
        )
        if disputed_project.selected_proposal_id != disputed_proposal.id:
            disputed_project.selected_proposal = disputed_proposal
            disputed_project.status = Project.STATUS_DISPUTED
            disputed_project.save(update_fields=["selected_proposal", "status"])

        disputed_escrow, _ = Escrow.objects.get_or_create(
            project=disputed_project,
            defaults={"amount": disputed_proposal.price, "status": Escrow.STATUS_DISPUTED},
        )
        if disputed_escrow.status != Escrow.STATUS_DISPUTED:
            disputed_escrow.amount = disputed_proposal.price
            disputed_escrow.status = Escrow.STATUS_DISPUTED
            disputed_escrow.save(update_fields=["amount", "status", "updated_at"])
        if not disputed_escrow.ledger_entries.filter(entry_type=LedgerEntry.TYPE_DEPOSIT).exists():
            LedgerEntry.objects.create(
                escrow=disputed_escrow,
                entry_type=LedgerEntry.TYPE_DEPOSIT,
                amount=disputed_proposal.price,
                note="Seed disputed deposit",
            )

        Dispute.objects.get_or_create(
            project=disputed_project,
            raised_by=client,
            defaults={
                "reason": "Seed dispute for admin resolve flow",
                "evidence_files": [],
            },
        )

        ProjectMessage.objects.get_or_create(
            project=open_project,
            sender=client,
            text="Please share your approach and timeline.",
            defaults={"type": ProjectMessage.TYPE_TEXT},
        )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("Demo accounts (password: Pass1234!):")
        self.stdout.write("- admin@itzuun.mn (admin)")
        self.stdout.write("- client@itzuun.mn (client)")
        self.stdout.write("- freelancer.pending@itzuun.mn (freelancer, unverified)")
        self.stdout.write("- freelancer@itzuun.mn (freelancer, verified)")
