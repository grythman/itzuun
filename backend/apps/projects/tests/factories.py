import factory

from apps.accounts.models import User
from apps.projects.models import Project


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.mn")
    username = factory.Sequence(lambda n: f"user{n}")


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    owner = factory.SubFactory(UserFactory)
    title = factory.Faker("sentence", nb_words=4)
    status = "open"
