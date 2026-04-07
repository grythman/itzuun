from django.test import SimpleTestCase
from django.urls import resolve


class ApiConventionRouteTests(SimpleTestCase):
    def test_auth_alias_and_canonical_login_routes_resolve(self):
        alias_match = resolve("/api/v1/auth/login/")
        canonical_match = resolve("/api/v1/accounts/auth/login/")

        self.assertEqual(alias_match.url_name, "login")
        self.assertEqual(canonical_match.url_name, "login")

    def test_auth_routes_accept_missing_trailing_slash(self):
        alias_match = resolve("/api/v1/auth/login")
        canonical_match = resolve("/api/v1/accounts/auth/login")

        self.assertEqual(alias_match.url_name, "login")
        self.assertEqual(canonical_match.url_name, "login")

    def test_payment_compatibility_routes_resolve(self):
        create_match = resolve("/api/v1/payments/project/7/create/")
        status_match = resolve("/api/v1/payments/project/7/status/")

        self.assertEqual(create_match.url_name, "payment-create")
        self.assertEqual(status_match.url_name, "payment-status")

    def test_canonical_escrow_route_resolves(self):
        deposit_match = resolve("/api/v1/projects/7/escrow/deposit/")

        self.assertEqual(deposit_match.url_name, "escrow-deposit")
