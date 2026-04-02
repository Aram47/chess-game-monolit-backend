# Google OAuth Setup (Backend-Centric)

This document explains how Google OAuth is integrated in this backend, why the architecture is designed this way, and the exact setup steps for local and production environments.

---

## 1) Goal and Architecture Choice

### Goal

Enable users to sign in/sign up with Google while preserving the project's existing authentication model:

- access/refresh JWT tokens
- HTTP-only cookies
- API Gateway-based auth flow

### Why backend-centric OAuth (instead of frontend token exchange)

The backend owns:

- client secret (never exposed to browser)
- user linking/creation logic
- JWT issuance and cookie policy
- uniform auth behavior for local login and social login

This avoids duplicate auth paths and keeps security-critical logic in one place.

---

## 2) Current OAuth Components in Code

Implemented scaffolding under `src/auth/oauth`:

- `oauth.module.ts`
  - imports Passport module
  - registers OAuth controller + Google strategy
- `oauth.controller.ts`
  - `GET /api/auth/google`
  - `GET /api/auth/google/callback`
- `oauth.service.ts`
  - integration point for your business logic (`handleGoogleCallback`)

Shared OAuth primitives now live in `common`:

- `common/dtos/auth/google-oauth-profile.dto.ts`
- `common/libs/interfaces/oauth-request-user.interface.ts`
- `common/libs/guards/google-oauth.guard.ts`
- `common/libs/strategies/google.strategy.ts`

Environment keys are centralized in `common/constants/env_constants.ts`.

---

## 3) End-to-End Request Flow

### A. Start OAuth

1. Frontend redirects user to `GET /api/auth/google`.
2. `GoogleOauthGuard` triggers passport Google strategy.
3. User is redirected to Google consent screen.

### B. Callback from Google

1. Google calls `GET /api/auth/google/callback`.
2. Guard validates response and provides mapped profile in `req.user.profile`.
3. Controller calls `oauthService.handleGoogleCallback(profile)`.
4. Service behavior in current implementation:
   - finds user by email (case-insensitive)
   - creates a user if it does not exist via **`UserService.createOAuthUser`**: `authProvider = google`, **`password = null`**, unique username (no local password)
   - issues JWT access/refresh tokens
   - returns sanitized user payload and redirect target
5. On failure, controller redirects to `${FRONTEND_URL}/login?oauth=failed`.

---

## 4) Google Cloud Console Setup

1. Create/select Google Cloud project.
2. Configure OAuth consent screen.
3. Create OAuth 2.0 Client ID of type **Web application**.
4. Add redirect URI(s) that match backend callback exactly.

### Redirect URI examples

- local: `http://localhost:3000/api/auth/google/callback`
- LAN dev: `http://10.19.223.110:3000/api/auth/google/callback`
- production: `https://api.yourdomain.com/api/auth/google/callback`

Important:

- redirect URI must be exact (scheme, host, port, path)
- `GOOGLE_CALLBACK_URL` must match one registered URI

---

## 5) Environment Configuration

Required backend env variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

Already present in:

- `.env.example`
- `.env.development`
- `ENV_VARIABLES` constants map

---

## 6) What Is Implemented in `OauthService`

`handleGoogleCallback(profile)` currently does:

1. **Identity validation**
   - require non-empty `profile.email`
2. **User lookup/linking strategy**
   - find user by email
   - if not found, create new user and related data via **`createOAuthUser`** (not email/password registration)
3. **Token creation**
   - uses existing JWT secrets/expirations through `JwtUtils`
4. **Controller contract**
   - returns access token, refresh token, safe user response, and redirect URL

Current return contract from service:

- `accessToken`
- `refreshToken`
- `redirectTo` (usually frontend post-auth route)
- `user` (sanitized)

---

## 7) Recommended Callback Response Pattern

Current backend callback pattern:

1. callback endpoint sets HTTP-only cookies (`accessToken`, `refreshToken`)
2. callback endpoint redirects to `FRONTEND_URL/auth/callback?user=<encoded-json>`
3. frontend callback page reads `user` query param and stores user in local auth state

Why:

- cookies are set server-side securely
- frontend does not handle raw third-party tokens
- behavior is consistent with existing auth middleware and refresh logic

---

## 8) Security and Production Notes

- Use HTTPS in production.
- Use secure cookie settings in production.
- Restrict CORS origins in production (avoid permissive `origin: true`).
- Keep Google client secret only on backend.
- Handle account-linking conflicts explicitly:
  - local account with same email
  - already linked to another provider
- Log OAuth failures without leaking sensitive details.

---

## 9) Frontend Integration Steps (High Level)

1. Add "Continue with Google" button that navigates to `/api/auth/google`.
2. Add frontend route for post-auth handling (e.g. `/auth/callback`).
3. In callback page:
   - show loading state
   - parse `user` query parameter
   - persist user in local auth state
   - redirect to app home/dashboard
4. Show friendly retry message on `/login?oauth=failed`.

---

## 10) Legacy Google-created rows (optional backfill)

Older versions created Google users with a **random bcrypt password** and no `authProvider` distinction. New sign-ups use **`authProvider = google`** and **`password` NULL**.

If you still have such legacy rows and want them to match Google-only behavior (no `/api/login` password path, no `PATCH .../profile/me/password`), run a **one-off SQL** for known accounts only. Table/column names follow TypeORM defaults (e.g. `"Users"`, `"authProvider"`, `"password"`):

```sql
UPDATE "Users"
SET "authProvider" = 'google', "password" = NULL
WHERE id IN (/* ids you know are Google-only */);
```

Do not run blindly: local email/password users must keep `authProvider = 'local'` and a non-null password hash.

---

## 11) Troubleshooting Checklist

- `redirect_uri_mismatch`
  - verify exact URI in Google Console and `GOOGLE_CALLBACK_URL`
- callback loops back to login
  - check `FRONTEND_URL` value and callback error handling
- user authenticated but frontend appears logged out
  - confirm cookies are set and included (`credentials: include`)
- strategy not initialized
  - verify `OauthModule` is imported by `AuthModule`
- missing env errors at startup
  - check `.env.{NODE_ENV}` and required variable names

---

## 12) Why this module split is correct

Keeping OAuth in `auth/oauth` submodule gives:

- clear separation between local auth and provider auth
- easier extension to Apple/GitHub later
- smaller, testable classes
- fewer side effects in `AuthService`
- cleaner module boundaries in a growing monolith

This aligns with NestJS modular design and keeps auth maintainable long term.
