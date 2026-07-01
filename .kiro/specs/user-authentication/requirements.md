# Requirements Document

## Introduction

This feature adds end-to-end user authentication to the HealthKaki / SubsidyKaki Next.js web app using the existing Supabase integration. Users must be able to sign up and log in with an email address and password, and all main app screens must be protected behind a valid authenticated session. Session state must survive page refreshes. A sign-out action must be accessible from the Settings screen.

## Glossary

- **Auth_Service**: The Supabase authentication layer accessed via `@supabase/ssr` browser and server clients already configured in `src/services/supabase/`.
- **Session**: A Supabase user session consisting of an access token and refresh token, persisted in browser cookies.
- **Auth_Guard**: The mechanism (Next.js middleware or client-side gate) that prevents unauthenticated users from accessing protected screens.
- **Login_Screen**: A dedicated UI screen that presents the sign-in form.
- **Signup_Screen**: A dedicated UI screen that presents the account creation form.
- **Protected_App**: The `App` shell (`src/App.tsx`) and all screens it renders — home, camera, confirm, processing, results, bill, medications, details, history, help, settings, error.
- **Settings_Screen**: The existing `src/screens/Settings.tsx` screen where the sign-out control is placed.
- **User**: An authenticated individual who holds a valid Supabase session.

---

## Requirements

### Requirement 1: User Sign-up

**User Story:** As a new visitor, I want to create an account with my email address and password, so that I can access the app and have my data tied to my identity.

#### Acceptance Criteria

1. WHEN a visitor navigates to the sign-up screen, THE Signup_Screen SHALL display an email input field, a password input field, a confirm-password input field, and a submit button.
2. WHEN a visitor submits a valid email and a password of at least 8 characters with matching confirm-password, THE Auth_Service SHALL create a new user account and sign the visitor in.
3. WHEN sign-up succeeds, THE Auth_Guard SHALL redirect the user to the home screen of the Protected_App.
4. IF the submitted email address is already registered, THEN THE Signup_Screen SHALL display an inline error message indicating the email is already in use.
5. IF the submitted password is fewer than 8 characters, THEN THE Signup_Screen SHALL display an inline error message stating the minimum password length requirement.
6. IF the submitted confirm-password does not match the password, THEN THE Signup_Screen SHALL display an inline error message before the form is submitted to the Auth_Service.
7. IF the Auth_Service returns an error during sign-up, THEN THE Signup_Screen SHALL display the error message returned by the Auth_Service.
8. WHILE a sign-up submission is in progress, THE Signup_Screen SHALL disable the submit button and display a loading indicator to prevent duplicate submissions.

---

### Requirement 2: User Login

**User Story:** As a returning user, I want to log in with my email address and password, so that I can access my account and use the app.

#### Acceptance Criteria

1. WHEN a visitor navigates to the login screen, THE Login_Screen SHALL display an email input field, a password input field, and a submit button.
2. WHEN a visitor submits a registered email and correct password, THE Auth_Service SHALL authenticate the visitor and establish a Session.
3. WHEN login succeeds, THE Auth_Guard SHALL redirect the user to the home screen of the Protected_App.
4. IF the submitted email or password is incorrect, THEN THE Login_Screen SHALL display an inline error message indicating the credentials are invalid, without specifying which field is wrong.
5. IF the Auth_Service returns an error during login, THEN THE Login_Screen SHALL display the error message returned by the Auth_Service.
6. WHILE a login submission is in progress, THE Login_Screen SHALL disable the submit button and display a loading indicator to prevent duplicate submissions.
7. THE Login_Screen SHALL provide a clearly labelled link to the Signup_Screen for visitors without an account.
8. THE Signup_Screen SHALL provide a clearly labelled link to the Login_Screen for visitors who already have an account.

---

### Requirement 3: Route Protection

**User Story:** As the system, I want all main app screens to require authentication, so that only signed-in users can access sensitive health and subsidy information.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor attempts to access any route that serves the Protected_App, THE Auth_Guard SHALL redirect the visitor to the Login_Screen.
2. WHEN an authenticated user navigates to the login or sign-up screen, THE Auth_Guard SHALL redirect the user to the home screen of the Protected_App.
3. THE Auth_Guard SHALL evaluate the Session on every navigation and page load to ensure only valid sessions grant access.
4. IF a Session has expired, THEN THE Auth_Guard SHALL treat the visitor as unauthenticated and redirect to the Login_Screen.

---

### Requirement 4: Session Persistence

**User Story:** As a user, I want my login session to persist across page refreshes and browser restarts, so that I do not have to log in every time I use the app.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Auth_Service SHALL store the Session in a secure, HTTP-only cookie.
2. WHEN the page is refreshed, THE Auth_Guard SHALL read the Session from the cookie and restore the authenticated state without requiring the user to log in again.
3. WHEN an access token is within the expiry window, THE Auth_Service SHALL automatically refresh it using the stored refresh token without user interaction.
4. IF the refresh token is invalid or expired, THEN THE Auth_Service SHALL clear the Session cookie and THE Auth_Guard SHALL redirect the user to the Login_Screen.

---

### Requirement 5: Sign-out

**User Story:** As a user, I want to sign out from the Settings screen, so that I can end my session and prevent others from accessing my account on this device.

#### Acceptance Criteria

1. THE Settings_Screen SHALL display a clearly labelled "Sign out" button in the Profile section.
2. WHEN a user presses the "Sign out" button, THE Auth_Service SHALL invalidate the current Session and clear all Session cookies.
3. WHEN sign-out completes, THE Auth_Guard SHALL redirect the user to the Login_Screen.
4. IF the Auth_Service returns an error during sign-out, THEN THE Settings_Screen SHALL display an error message and keep the user on the Settings_Screen.
5. WHILE a sign-out request is in progress, THE Settings_Screen SHALL disable the "Sign out" button to prevent duplicate requests.

---

### Requirement 6: Input Validation and Accessibility

**User Story:** As a user, I want the authentication forms to be accessible and validate my input clearly, so that I can complete sign-up and login without confusion.

#### Acceptance Criteria

1. THE Login_Screen SHALL associate each input field with a visible label using accessible HTML markup.
2. THE Signup_Screen SHALL associate each input field with a visible label using accessible HTML markup.
3. WHEN an inline validation error is displayed, THE Auth_Guard SHALL move keyboard focus to the first field with an error so screen-reader users are informed.
4. THE Login_Screen SHALL use `type="email"` for the email field and `type="password"` for the password field to enable native browser validation and masking.
5. THE Signup_Screen SHALL use `type="email"` for the email field and `type="password"` for the password and confirm-password fields.
6. WHERE a user's browser supports password manager auto-fill, THE Login_Screen SHALL not prevent credential auto-fill by using standard `autocomplete` attributes (`email`, `current-password`).
7. WHERE a user's browser supports password manager auto-fill, THE Signup_Screen SHALL not prevent credential auto-fill by using standard `autocomplete` attributes (`email`, `new-password`).
