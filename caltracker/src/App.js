import React, { useState, useEffect } from "react";
import EntryForm     from "./components/EntryForm";
import EntryList     from "./components/EntryList";
import WeightTracker from "./components/WeightTracker";
import './App.css';

import {
  onAuthReady,
  signUp,
  signIn,
  signOutUser,
  loadUserSettings,
  saveUserSettings
} from "./firebase";

function App() {
  // Auth
  const [user,      setUser]      = useState(undefined);
  const [mode,      setMode]      = useState("login");
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [authError, setAuthError] = useState("");

  // Profile/TDEE
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [heightFeet,    setHeightFeet]    = useState("");
  const [heightInches,  setHeightInches]  = useState("");
  const [weightLbs,     setWeightLbs]     = useState("");
  const [age,           setAge]           = useState("");
  const [gender,        setGender]        = useState("male");
  const [activity,      setActivity]      = useState("1.55");
  const [tdee,          setTdee]          = useState(null);
  const [showProfile,   setShowProfile]   = useState(true);

  // Weight‐loss plan
  const [desiredWeight, setDesiredWeight] = useState("");
  const [timeWeeks,     setTimeWeeks]     = useState("");
  const [planCal,       setPlanCal]       = useState(null);
  const [showPlan,      setShowPlan]      = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthReady(u => setUser(u));
    return unsub;
  }, []);

  // Load settings on sign-in
  useEffect(() => {
    if (!user) return;
    loadUserSettings(user.uid).then(s => {
      if (!s) return;
      const {
        heightFeet, heightInches, weightLbs,
        age, gender, activity,
        targetCalories,
        desiredWeight, timeFrameWeeks, planCalories
      } = s;

      setHeightFeet(heightFeet);
      setHeightInches(heightInches);
      setWeightLbs(weightLbs);
      setAge(age);
      setGender(gender);
      setActivity(activity);
      setTdee(targetCalories);
      setShowProfile(!targetCalories);

      if (desiredWeight && timeFrameWeeks && planCalories) {
        setDesiredWeight(desiredWeight);
        setTimeWeeks(timeFrameWeeks);
        setPlanCal(planCalories);
        setShowPlan(true);
      }
    });
  }, [user]);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (user === null) {
    const handleAuth = async e => {
      e.preventDefault();
      setAuthError("");
      try {
        if (mode === "login") await signIn(email, pass);
        else                   await signUp(email, pass);
      } catch (err) {
        setAuthError(err.message);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleAuth} className="p-6 bg-white rounded shadow w-80 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {mode === "login" ? "Log In" : "Sign Up"}
          </h2>
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded"
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>
          <p className="text-sm text-center">
            {mode === "login" ? "Need an account?" : "Have one?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(m => (m === "login" ? "signup" : "login"));
                setAuthError("");
              }}
              className="text-blue-600 underline"
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  // Signed-in dashboard
  const uid = user.uid;

  const saveProfile = async e => {
    e.preventDefault();
    const ft   = Number(heightFeet)   || 0;
    const inch = Number(heightInches) || 0;
    const hCm  = ft * 30.48 + inch * 2.54;
    const wKg  = (Number(weightLbs) || 0) / 2.20462;
    const a    = Number(age) || 0;
    const act  = Number(activity) || 0;
    const base = 10 * wKg + 6.25 * hCm - 5 * a;
    const bmr  = gender === "male" ? base + 5 : base - 161;
    const cal  = Math.round(bmr * act);

    setTdee(cal);
    await saveUserSettings(uid, {
      heightFeet,
      heightInches,
      weightLbs,
      age,
      gender,
      activity,
      targetCalories: cal,
      desiredWeight,
      timeFrameWeeks: timeWeeks,
      planCalories: planCal
    });
    setShowProfile(false);
  };

  const savePlan = async e => {
    e.preventDefault();
    const curr  = Number(weightLbs)    || 0;
    const targ  = Number(desiredWeight) || 0;
    const weeks = Number(timeWeeks)     || 1;
    const diff  = (curr - targ) * 3500;
    const daily = diff / (weeks * 7);
    const intake= Math.round(tdee - daily);

    setPlanCal(intake);
    await saveUserSettings(uid, {
      desiredWeight,
      timeFrameWeeks: timeWeeks,
      planCalories: intake
    });
    setShowPlan(true);
  };

  const dailyGoal = showPlan ? planCal : tdee;
  const deficit   = showPlan ? tdee - planCal : 0;

  const [yy, mm, dd] = selectedDate.split("-");
  const headerDate   = new Date(+yy, +mm - 1, +dd);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full max-w-xl mx-auto p-4 bg-white flex justify-between items-center shadow">
        <h1 className="text-2xl font-bold">Calorie Tracker</h1>
        <button
          onClick={() => signOutUser()}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </header>

      <section className="max-w-xl mx-auto p-4 bg-white mt-4 rounded shadow">
        <p className="text-sm mb-2">
          Viewing{" "}
          <strong>
            {headerDate.toLocaleDateString(undefined, {
              weekday: "long",
              year:    "numeric",
              month:   "long",
              day:     "numeric"
            })}
          </strong>
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-2 py-1 border rounded mb-4"
        />

        {showProfile ? (
          <form onSubmit={saveProfile} className="space-y-2 text-sm">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Height (ft)"
                value={heightFeet}
                onChange={e => setHeightFeet(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
              <input
                type="number"
                placeholder="Height (in)"
                value={heightInches}
                onChange={e => setHeightInches(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={weightLbs}
                onChange={e => setWeightLbs(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
              <input
                type="number"
                placeholder="Age (yrs)"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select
                value={activity}
                onChange={e => setActivity(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              >
                <option value="1.2">Sedentary</option>
                <option value="1.375">Light (1–3d/wk)</option>
                <option value="1.55">Moderate (3–5d/wk)</option>
                <option value="1.725">Very Active (6–7d/wk)</option>
                <option value="1.9">Extreme</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded"
            >
              Calculate TDEE
            </button>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <p><strong>TDEE:</strong> {tdee} kcal/day</p>
              <button
                onClick={() => setShowProfile(true)}
                className="text-blue-600 underline text-sm"
              >
                Recalc
              </button>
            </div>

            {showPlan ? (
              <div className="space-y-1">
                <p>
                  From <strong>{weightLbs} lbs</strong> →{" "}
                  <strong>{desiredWeight} lbs</strong> in{" "}
                  <strong>{timeWeeks} weeks</strong>:{" "}
                  <strong>{planCal}</strong> kcal/day
                </p>
                <p className="text-sm text-gray-700">
                  You’re eating <strong>{deficit}</strong> kcal/day less than maintenance.
                </p>
                <button
                  onClick={() => setShowPlan(false)}
                  className="text-yellow-600 underline text-sm"
                >
                  Edit Plan
                </button>
              </div>
            ) : (
              <form onSubmit={savePlan} className="flex gap-2 text-sm">
                <input
                  type="number"
                  placeholder="Target lbs"
                  value={desiredWeight}
                  onChange={e => setDesiredWeight(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded"
                />
                <input
                  type="number"
                  placeholder="Weeks"
                  value={timeWeeks}
                  onChange={e => setTimeWeeks(e.target.value)}
                  className="w-24 px-2 py-1 border rounded"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Plan
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <main className="max-w-xl mx-auto mt-6 space-y-6">
        <WeightTracker uid={uid} desiredWeight={desiredWeight} />
        <EntryForm />
        <EntryList
          uid={uid}
          selectedDate={selectedDate}
          targetCalories={dailyGoal}
        />
      </main>
    </div>
  );
}

export default App;
