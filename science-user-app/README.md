# Science User App

Static Expo prototype for the Science user-facing mobile/web app. It uses Expo Router and React Native components to demonstrate the current onboarding, discovery, article reading, quiz, streak, level-up, and achievement flows.

## Current status

- Screens currently use mock data only.
- A typed public article API client exists, but Discover/Article/Quiz screens are not connected to it yet.
- Authentication, database persistence, and production content loading are not wired up in this prototype.

## Install dependencies

```bash
npm install
```

## Public backend API configuration

The app reads the public backend URL from Expo's public environment variable support:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

Copy `.env.example` to `.env` for local development and update the value if your backend runs elsewhere. This value is bundled into the frontend by Expo, so it must use the `EXPO_PUBLIC_` prefix and should not contain secrets. It is only the public API base URL.

For local web testing on the same computer as the backend, use:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

For Android/iOS emulator or physical-device testing, `localhost` may point at the emulator/device instead of your computer. If the app cannot reach the backend, replace `localhost` with your development computer's LAN IP, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8000
```

## Run web

```bash
npm run web
```

## Run Android

```bash
npm run android
```

This opens the Expo Android target. Use an Android emulator or a connected Android device with Expo tooling available.

## Run iOS

```bash
npm run ios
```

This opens the Expo iOS target. iOS development requires macOS with an iOS Simulator or a compatible connected device.