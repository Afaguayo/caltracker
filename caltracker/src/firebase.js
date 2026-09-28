// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import { dayBounds, todayStr, parseDateStr } from "./lib/calc";

// .env-based config
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// — Auth helpers —
export function onAuthReady(cb) {
  return onAuthStateChanged(auth, cb);
}
export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function signOutUser() {
  return signOut(auth);
}

// — User settings —
export async function loadUserSettings(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
export async function saveUserSettings(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

// — Entry helpers (users/{uid}/entries) —
// Entries for today get the server time; entries logged for another day
// are stamped at noon of that day so they show up under it.
export async function addEntry(entry, dateStr = todayStr()) {
  const uid = auth.currentUser.uid;
  const ref = collection(db, "users", uid, "entries");
  let createdAt = serverTimestamp();
  if (dateStr !== todayStr()) {
    const noon = parseDateStr(dateStr);
    noon.setHours(12);
    createdAt = Timestamp.fromDate(noon);
  }
  return addDoc(ref, { ...entry, createdAt });
}
export function deleteEntry(id) {
  const uid = auth.currentUser.uid;
  return deleteDoc(doc(db, "users", uid, "entries", id));
}
export function updateEntry(id, updates) {
  const uid = auth.currentUser.uid;
  return updateDoc(doc(db, "users", uid, "entries", id), updates);
}
export function subscribeEntriesForDate(uid, dateStr, onUpdate) {
  const { start, end } = dayBounds(dateStr);

  const ref = collection(db, "users", uid, "entries");
  const q   = query(
    ref,
    where("createdAt", ">=", Timestamp.fromDate(start)),
    where("createdAt", "<=", Timestamp.fromDate(end)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    snap => {
      const arr = snap.docs.map(d => {
        const data = d.data();
        return {
          id:          d.id,
          description: data.description,
          calories:    data.calories,
          protein:     data.protein || 0,
          // Pending server timestamps are null locally until written.
          createdAt:   data.createdAt?.toDate() || new Date(),
        };
      });
      onUpdate(arr);
    },
    err => {
      console.error("Firestore entries listener error:", err);
    }
  );
}

// — Weight log helpers (users/{uid}/weightLogs) —
export async function addWeightLog(uid, { date, weight }) {
  const ref = collection(db, "users", uid, "weightLogs");
  return addDoc(ref, {
    date: Timestamp.fromDate(date),
    weight,
  });
}
export function subscribeWeightLogs(uid, onUpdate) {
  const ref = collection(db, "users", uid, "weightLogs");
  const q   = query(
    ref,
    orderBy("date")
  );
  return onSnapshot(
    q,
    snap => {
      const logs = snap.docs.map(d => {
        const data = d.data();
        return {
          id:     d.id,
          date:   data.date.toDate(),
          weight: data.weight
        };
      });
      onUpdate(logs);
    },
    err => {
      console.error("Firestore weightLogs listener error:", err);
    }
  );
}
export async function updateWeightLog(id, { weight, date }) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, "users", uid, "weightLogs", id);
  const updates = { weight };
  if (date) updates.date = Timestamp.fromDate(date);
  return updateDoc(ref, updates);
}
export function deleteWeightLog(id) {
  const uid = auth.currentUser.uid;
  return deleteDoc(doc(db, "users", uid, "weightLogs", id));
}

export { app, auth, db };
