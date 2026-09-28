# Calorie Tracker

A calorie, protein and weight tracker built with React and Firebase (Auth + Firestore), hosted on Firebase Hosting.

## Features

- **Accounts**: email/password sign-up and log-in (Firebase Auth); each user's data is private.
- **TDEE calculator**: Mifflin-St Jeor BMR × activity level, saved to your profile.
- **Weight plan**: pick a target weight and number of weeks, and get a daily calorie target. It warns you if the target falls below 1,500 kcal (male) or 1,200 kcal (female).
- **Food log**: log calories and protein for any day, not just today; edit or delete entries.
- **Daily summary**: goal, remaining or over, a progress bar and protein total. Calories eaten over yesterday's goal carry over and reduce today's goal.
- **Weight progress**: log weigh-ins by date, see a line chart against your goal, change since your first weigh-in, and a suggested protein intake (1 g/lb).
- **Day navigation**: step back and forward through days, or jump to today.

## Getting started

```bash
cd caltracker
npm install
cp .env.example .env   # fill in your Firebase web app config
npm start              # http://localhost:3000
```

The Firebase config values come from **Firebase console → Project settings → Your apps → Web app**.
In the console, enable **Authentication → Email/Password** and create a **Firestore** database.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm test` | Unit tests (calculations) and App smoke tests; Firebase is mocked |
| `npm run build` | Production build into `build/` |

## Deploy

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

`firestore.rules` limits every user to their own `users/{uid}` document and its `entries` and `weightLogs` subcollections, and checks that entries have a description and non-negative calories and that weigh-ins have a positive weight and a date. **Deploy the rules**; without them the database falls back to whatever rules the Firebase console has.

## Data model

```
users/{uid}                     profile: height, weight, age, gender, activity,
                                targetCalories (TDEE), desiredWeight,
                                timeFrameWeeks, planCalories
users/{uid}/entries/{id}        description, calories, protein, createdAt
users/{uid}/weightLogs/{id}     weight, date
```

## Project layout

```
src/
├── App.js                  auth screens, profile/TDEE, weight plan, day picker
├── firebase.js             Firebase init + all Auth/Firestore calls
├── lib/calc.js             pure math and date helpers (unit tested)
└── components/
    ├── EntryForm.js        log food for the selected day
    ├── EntryList.js        daily summary, progress bar, edit/delete entries
    └── WeightTracker.js    weigh-ins, chart, protein suggestion
```
