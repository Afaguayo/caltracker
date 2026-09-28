# Calorie Tracker

A web app for tracking calories, protein and weight toward a goal. You sign in, it works out how many calories you burn in a day, turns your target weight and timeline into a daily calorie goal, and keeps a running log of food and weigh-ins. Built with React and Firebase (Auth, Firestore and Hosting).

## What it does

- **Accounts:** email and password sign-up and login with Firebase Auth. Each user's data is private to them.
- **Daily burn (TDEE):** enter height, weight, age, sex and activity level. It calculates your basal metabolic rate with the Mifflin-St Jeor formula, then multiplies it by your activity level (1.2 sedentary up to 1.9 extreme).
- **Weight-loss plan:** enter a target weight and a number of weeks. It turns the difference into a daily calorie goal, using 3,500 kcal per pound, and shows how far under maintenance that is.
- **Food log:** add foods with calories and protein for any day, and edit or delete them. The day's totals, goal and remaining calories update live.
- **Carry-over:** if you went over your goal yesterday, the extra is taken off today's goal.
- **Weight progress:** log weigh-ins and see them on a line chart (Recharts) with your goal weight as a reference line. It also suggests a daily protein target of 1 g per pound of body weight.
- **Any date:** a date picker lets you look back at, or fill in, past days.

## Run it

The app lives in the [`caltracker/`](caltracker) folder.

```bash
cd caltracker
npm install
```

Create a Firebase project with **Authentication (Email/Password)** and **Cloud Firestore** turned on. Then add a `caltracker/.env` file with the project's web config:

```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

```bash
npm start                 # http://localhost:3000
npm run build             # production build in build/
firebase deploy --only hosting
```

## How the data is stored

Everything is stored under the signed-in user, so Firestore security rules can limit each user to their own documents:

```text
users/{uid}                  profile, TDEE and plan settings
users/{uid}/entries/{id}     food: description, calories, protein, createdAt
users/{uid}/weightLogs/{id}  weigh-ins: date, weight
```

Food for a given day is loaded with a Firestore query on `createdAt` between that day's midnight and 23:59:59, using a live listener, so edits show up right away.

## Stack

React 19 (Create React App), Firebase 11 (Auth, Firestore, Hosting), Recharts and Framer Motion.

Built for CS 4381/5381 (Applied Agile Software Development and Data Management) at UTEP. [`howtohost.txt`](caltracker/howtohost.txt) has the course's Firebase Hosting steps.
