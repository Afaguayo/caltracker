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
import {
  calcTdee,
  calcPlan,
  todayStr,
  shiftDateStr,
  parseDateStr
} from "./lib/calc";

const AUTH_ERRORS = {
  "auth/invalid-credential":   "Wrong email or password.",
  "auth/wrong-password":       "Wrong email or password.",
  "auth/user-not-found":       "No account with that email.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password":        "Password must be at least 6 characters.",
  "auth/invalid-email":        "That email address isn't valid.",
  "auth/too-many-requests":    "Too many attempts. Try again in a few minutes."
};

function App() {
  // Auth
  const [user,      setUser]      = useState(undefined);
  const [mode,      setMode]      = useState("login");
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [authError, setAuthError] = useState("");

  // Profile/TDEE
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [heightFeet,    setHeightFeet]    = useState("");
  const [heightInches,  setHeightInches]  = useState("");
  const [weightLbs,     setWeightLbs]     = useState("");
  const [age,           setAge]           = useState("");
  const [gender,        setGender]        = useState("male");
  const [activity,      setActivity]      = useState("1.55");
  const [tdee,          setTdee]          = useState(null);
  const [showProfile,   setShowProfile]   = useState(true);
  const [profileError,  setProfileError]  = useState("");

  // Weight‐loss plan
  const [desiredWeight, setDesiredWeight] = useState("");
  const [timeWeeks,     setTimeWeeks]     = useState("");
  const [plan,          setPlan]          = useState(null);
  const [showPlan,      setShowPlan]      = useState(false);
  const [planError,     setPlanError]     = useState("");

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
        heightFeet = "", heightInches = "", weightLbs = "",
        age = "", gender = "male", activity = "1.55",
        targetCalories,
        desiredWeight, timeFrameWeeks
      } = s;

      setHeightFeet(heightFeet);
      setHeightInches(heightInches);
      setWeightLbs(weightLbs);
      setAge(age);
      setGender(gender);
      setActivity(activity);
      setTdee(targetCalories || null);
      setShowProfile(!targetCalories);

      if (targetCalories && desiredWeight && timeFrameWeeks) {
        const p = calcPlan({
          tdee: targetCalories, currentWeight: weightLbs,
          targetWeight: desiredWeight, weeks: timeFrameWeeks, gender
        });
        setDesiredWeight(desiredWeight);
        setTimeWeeks(timeFrameWeeks);
        if (!p.error) {
          setPlan(p);
          setShowPlan(true);
        }
      }
    }).catch(err => console.error("Failed to load settings:", err));
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
        setAuthError(AUTH_ERRORS[err.code] || err.message);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleAuth} className="p-6 bg-white rounded shadow w-80 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {mode === "login" ? "Log In" : "Sign Up"}
          </h2>
          {authError && <p className="text-red-600 text-sm" role="alert">{authError}</p>}
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
            minLength={6}
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
    const cal = calcTdee({ heightFeet, heightInches, weightLbs, age, gender, activity });
    if (cal == null) {
      setProfileError("Fill in height, weight and age to calculate your TDEE.");
      return;
    }
    setProfileError("");
    setTdee(cal);

    // A saved plan depends on TDEE and weight, so recalculate it too.
    let planCalories = null;
    if (desiredWeight && timeWeeks) {
      const p = calcPlan({
        tdee: cal, currentWeight: weightLbs,
        targetWeight: desiredWeight, weeks: timeWeeks, gender
      });
      if (!p.error) {
        setPlan(p);
        planCalories = p.calories;
      }
    }

    await saveUserSettings(uid, {
      heightFeet,
      heightInches,
      weightLbs,
      age,
      gender,
      activity,
      targetCalories: cal,
      planCalories
    });
    setShowProfile(false);
  };

  const savePlan = async e => {
    e.preventDefault();
    const p = calcPlan({
      tdee, currentWeight: weightLbs,
      targetWeight: desiredWeight, weeks: timeWeeks, gender
    });
    if (p.error) {
      setPlanError(p.error);
      return;
    }
    setPlanError("");
    setPlan(p);
    await saveUserSettings(uid, {
      desiredWeight,
      timeFrameWeeks: timeWeeks,
      planCalories: p.calories
    });
    setShowPlan(true);
  };

  const clearPlan = async () => {
    setPlan(null);
    setShowPlan(false);
    setDesiredWeight("");
    setTimeWeeks("");
    await saveUserSettings(uid, { desiredWeight: "", timeFrameWeeks: "", planCalories: null });
  };

  const dailyGoal  = showPlan && plan ? plan.calories : tdee;
  const headerDate = parseDateStr(selectedDate);
  const isToday    = selectedDate === todayStr();

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
        <div className="flex gap-2 items-center mb-4">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setSelectedDate(d => shiftDateStr(d, -1))}
            className="px-2 py-1 bg-gray-300 rounded"
          >
            ‹
          </button>
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button
            type="button"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => setSelectedDate(d => shiftDateStr(d, 1))}
            className="px-2 py-1 bg-gray-300 rounded"
          >
            ›
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr())}
              className="text-blue-600 underline text-sm"
            >
              Today
            </button>
          )}
        </div>

        {showProfile ? (
          <form onSubmit={saveProfile} className="space-y-2 text-sm">
            {profileError && <p className="text-red-600" role="alert">{profileError}</p>}
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Height (ft)"
                value={heightFeet}
                onChange={e => setHeightFeet(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
              <input
                type="number"
                min="0"
                max="11"
                placeholder="Height (in)"
                value={heightInches}
                onChange={e => setHeightInches(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Weight (lbs)"
                value={weightLbs}
                onChange={e => setWeightLbs(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              />
              <input
                type="number"
                min="0"
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

            {showPlan && plan ? (
              <div className="space-y-1">
                <p>
                  From <strong>{weightLbs} lbs</strong> →{" "}
                  <strong>{desiredWeight} lbs</strong> in{" "}
                  <strong>{timeWeeks} weeks</strong>:{" "}
                  <strong>{plan.calories}</strong> kcal/day
                </p>
                <p className="text-sm text-gray-700">
                  {plan.dailyDeficit >= 0
                    ? <>You’re eating <strong>{plan.dailyDeficit}</strong> kcal/day less than maintenance ({plan.lbsPerWeek} lbs/week).</>
                    : <>You’re eating <strong>{-plan.dailyDeficit}</strong> kcal/day more than maintenance ({-plan.lbsPerWeek} lbs/week gain).</>}
                </p>
                {plan.belowMinimum && (
                  <p className="text-red-600" role="alert">
                    That’s below {plan.minimum} kcal/day, which isn’t recommended without
                    medical supervision. Try giving yourself more weeks.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPlan(false)}
                    className="text-yellow-600 underline text-sm"
                  >
                    Edit Plan
                  </button>
                  <button
                    onClick={clearPlan}
                    className="text-blue-600 underline text-sm"
                  >
                    Remove Plan
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={savePlan} className="space-y-2 text-sm">
                {planError && <p className="text-red-600" role="alert">{planError}</p>}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Target lbs"
                    value={desiredWeight}
                    onChange={e => setDesiredWeight(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    min="1"
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
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      <main className="max-w-xl mx-auto mt-6 space-y-6">
        <WeightTracker uid={uid} desiredWeight={showPlan ? desiredWeight : ""} />
        <EntryForm selectedDate={selectedDate} />
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
