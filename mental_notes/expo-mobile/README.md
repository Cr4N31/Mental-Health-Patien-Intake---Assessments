# Mental Notes mobile app

Expo Router app using React Native and TypeScript. The original Vite web app is unchanged.

## Start it

Install dependencies, copy `.env.example` to `.env`, and start the app. It uses the stable hosted Express API by default:

`https://mental-health-patien-intake-assessments.onrender.com/api`

To use a local backend instead, set `EXPO_PUBLIC_API_URL` to a device-reachable address (for example `http://10.0.2.2:5000/api` for an Android emulator, `http://localhost:5000/api` for an iOS simulator, or your computer's LAN IP for a physical phone).
Then run `npm start` and open the project in Expo Go or a development build. The API must be reachable from that device.

## Authentication

The web app keeps its existing HTTP-only cookie endpoints. The mobile app uses `POST /api/auth/mobile/session` and `POST /api/auth/mobile/register`, which return the existing public user shape plus a signed bearer token. Expo SecureStore persists the token; Axios sends it as `Authorization: Bearer ...`. The server accepts either bearer auth or the original cookie for protected routes. Password resets invalidate existing JWT sessions through the existing `passwordChangedAt` check. Mobile logout deletes the locally stored token; because these JWTs are stateless, a copied token remains usable until its seven-day expiry or a password reset.

## Checks

- `npm run typecheck`
- `npx expo install --check`
- `npx expo export --platform android`

The native export checks the complete route bundle. Interactive checks still require a simulator or phone and a reachable API.

