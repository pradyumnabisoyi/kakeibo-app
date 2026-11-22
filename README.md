# Kakeibo Ledger (React Native / Expo) 👋

An offline-first Android expense and income tracker inspired by the Japanese Kakeibo budgeting method.

## Features

- **Local On-Device Storage:** Uses `AsyncStorage` so all profile details and transactions stay private on your phone.
- **One-Time Profile Setup & Editing:** Stores Name, Mobile, Email (validated), Gender, and Birthdate.
- **Income & Expense Tracking:** Quick entry with date picker and smart item-name autocomplete from past entries.
- **Grouped Financial Reports:** Filter by **Annually**, **Monthly**, or **Custom Duration**. Identical items are grouped with expandable date-wise breakdowns, edit/delete actions, and summary totals (Income, Expenses, Remaining Balance).
- **PDF Export & Phone-to-Phone Backup:** Export formatted reports as PDF and back up/restore full ledger data via JSON files.

## Quick Start

```bash
npm install
npx expo start
```

Scan the QR code using the **Expo Go** app on Android.

## Steps

- npx create-expo-app Kakeibo
- cd Kakeibo
- npx expo install @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-community/datetimepicker
- npx expo install expo-print expo-sharing
- npx expo install @expo/vector-icons
- npx expo install expo-document-picker expo-file-system
- npx expo start -c
- git rm -rf .claude .vscode AGENTS.md scripts
- git rm -rf assets/expo.icon assets/images/tabIcons
- git rm -f assets/images/expo-badge-white.png assets/images/expo-badge.png assets/images/expo-logo.png assets/images/logo-glow.png assets/images/react-logo.png assets/images/react-logo@2x.png assets/images/react-logo@3x.png assets/images/tutorial-web.png