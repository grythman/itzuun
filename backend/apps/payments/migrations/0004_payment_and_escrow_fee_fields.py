from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_idx_project_status_created_and_more"),
        ("payments", "0003_dispute_idx_dispute_project_created_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="escrow",
            name="freelancer_amount",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="escrow",
            name="platform_fee_amount",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="escrow",
            name="status",
            field=models.CharField(
                choices=[
                    ("created", "Created"),
                    ("held", "Held"),
                    ("released", "Released"),
                    ("refunded", "Refunded"),
                    ("disputed", "Disputed"),
                ],
                default="created",
                max_length=32,
            ),
        ),
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("invoice_id", models.CharField(max_length=128, unique=True)),
                ("amount", models.PositiveIntegerField()),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("raw_response", models.JSONField(default=dict)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "status", "-created_at"], name="idx_pay_proj_status_cr"),
                    models.Index(fields=["status", "-created_at"], name="idx_payment_status_created"),
                ],
            },
        ),
    ]
