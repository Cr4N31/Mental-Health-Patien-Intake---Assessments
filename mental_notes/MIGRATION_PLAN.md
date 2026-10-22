# Expo mobile migration plan

## Repository findings
- Existing frontend: Vite + React 19 SPA (not Next.js), using React Router and Tailwind CSS.
- Backend: Express + MongoDB. Patient routes currently expose `/api/auth` and `/api/assessments`; therapist/client/note route files exist but are not mounted by `server/server.js`.
- Authentication: the web client keeps its HTTP-only JWT cookie. Native login/signup use dedicated endpoints that return a signed bearer token, saved in Expo SecureStore; protected backend middleware accepts either the cookie or bearer token. Mobile logout removes the local token. Tokens expire after seven days and password resets invalidate them; mobile logout does not revoke a copied stateless token.
- Business logic available for reuse: API endpoint contracts, assessment definitions/questions, scoring/severity/change functions, and user-facing screening disclosures. Keep scoring authoritative on the server.
- Web-specific pieces to rewrite: JSX containing HTML elements/forms/links, Tailwind classes, React Router navigation, Recharts chart, DOM form semantics, and cookie-only Axios setup.
- File uploads: no upload flow found in mounted patient app or routes.

## Screen-by-screen plan
1. Login and signup: implemented with Expo Router, native inputs, validation, forgot-password request, and mobile bearer auth.
2. Dashboard: implemented with native cards and scroll layout using `/assessments/latest` and `/assessments`.
3. Profile: added a native profile view based on authenticated user data, with verification-email resend.
4. Main features: implemented questionnaire, result/support information, and history/filter screens. PHQ-9/GAD-7 answers remain scored by the server. The web Recharts visualization is represented as an accessible recent-score list on mobile.
5. Settings: implemented result deletion and password-confirmed account deletion with a native destructive-action confirmation.

## Technical approach
- Create a separate `expo-mobile/` Expo app using TypeScript and Expo Router.
- Share only platform-neutral helpers by importing/copying deliberately documented logic; do not import web components or Tailwind styles.
- Configure an explicit `EXPO_PUBLIC_API_URL` for the existing Express API.
- Use Expo SecureStore for native bearer-token persistence; no password is stored on device. Native URLs and endpoint details are documented in `expo-mobile/README.md`.
- No uploads found; if a future feature adds them, use Expo document/image picker plus multipart FormData and extend backend routes as needed.

## Verification gates
- Each screen group passed TypeScript and Android Expo export checks as it was added. The final Expo SDK compatibility check passes, and the existing API health endpoint responds locally; mobile auth request validation was probed with invalid payloads.
- This machine has no Android `adb`/emulator, so interactive screen flows and successful login/signup against a device-configured API have not been exercised. Configure `EXPO_PUBLIC_API_URL` as described in `expo-mobile/README.md` and verify on a simulator/phone before release.
