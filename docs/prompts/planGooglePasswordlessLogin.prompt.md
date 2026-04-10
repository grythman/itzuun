Google passwordless login implementation plan

Goal
Replace or supplement the current email OTP passwordless flow with Google authentication in a way that fits the existing Django + Next.js auth architecture and preserves role-based onboarding.

Scope
Add Google sign-in support for authentication.
Keep the existing email/password login flow intact.
Keep email OTP as fallback unless explicitly removed later.
Use the existing JWT cookie session model after Google sign-in succeeds.
Support both client and freelancer role assignment for first-time users.

Backend plan
Add Google auth configuration to Django settings.
Expect GOOGLE_CLIENT_ID from environment.

Extend account services with Google token verification.
Verify the Google credential against Google token info or a verified token flow.
Validate audience against GOOGLE_CLIENT_ID.
Ensure the email is present and verified.
Convert external failures into clean domain/API errors instead of 500 responses.

Add a serializer for Google auth payload.
Accept credential and optional role.
Normalize the Google email.
Default role to client when not provided.

Add a new auth endpoint.
Create POST /api/v1/auth/google.
If user exists, sign them in.
If user does not exist, create them with the selected role.
Mark Google-authenticated users as verified.
Issue the same access_token and refresh_token cookies used by the existing auth flow.
Return the same authenticated/user response shape as login/register.

Keep current auth cookie helpers and JWT flow unchanged.
Do not introduce a separate session mechanism.

Frontend plan
Add a Google auth API client wrapper.
Create authApi.google({ credential, role }).

Update the auth page UI.
Load Google Identity Services script.
Render a Google sign-in button on the auth page.
Use the selected register role when the user is on the Register tab.
Use existing redirect logic after successful authentication.

Keep login/register forms active.
Position Google auth as the passwordless primary option.
Keep email OTP as fallback for development or secondary access.

Avoid unnecessary /auth/me refresh noise on public pages.
Do not force refresh loops while unauthenticated on public/auth routes.

Environment plan
Frontend env:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google client id>
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1

Backend env:
GOOGLE_CLIENT_ID=<google client id>

Google Cloud Console plan
Create a Web application OAuth client.
Add authorized JavaScript origins for local development:
http://localhost:3000
http://127.0.0.1:3000
Add production origins later when the deployment domain exists.

Validation plan
Confirm the Google button renders on /auth.
Confirm Google sign-in returns authenticated response and sets cookies.
Confirm /api/v1/auth/me succeeds after Google login.
Confirm first-time users are created with the intended role.
Confirm existing users can sign in without role regression.
Confirm logout still clears cookies successfully.

Risks and notes
The frontend only reads frontend/.env.local at runtime in the current setup.
backend/.env.example and frontend/.env.example are reference files only.
If the Google button does not render, first check NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local and restart the frontend.
If Google verification fails, inspect audience mismatch, missing verified email, or Google origin configuration.

Out of scope for this iteration
Google One Tap.
Profile sync from Google name/avatar.
Account linking flows across multiple providers.
Removing OTP entirely.