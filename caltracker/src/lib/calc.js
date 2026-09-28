// src/lib/calc.js
// Pure helpers (no Firebase) so they can be unit tested.

const KCAL_PER_LB = 3500;

// Lowest daily intake the plan will suggest without a warning.
export const MIN_SAFE_CALORIES = { male: 1500, female: 1200 };

// — Dates —
// Always work with the user's local calendar day ("YYYY-MM-DD"),
// never toISOString(), which is UTC and rolls over early in the Americas.
export function toDateStr(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}
export function todayStr() {
  return toDateStr(new Date());
}
export function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return new Date(+y, +m - 1, +d);
}
export function shiftDateStr(dateStr, days) {
  const date = parseDateStr(dateStr);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}
export function dayBounds(dateStr) {
  const start = parseDateStr(dateStr);
  const end   = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// — TDEE (Mifflin-St Jeor) —
// Returns null when any input is missing or not positive.
export function calcTdee({ heightFeet, heightInches, weightLbs, age, gender, activity }) {
  const ft   = Number(heightFeet)   || 0;
  const inch = Number(heightInches) || 0;
  const lbs  = Number(weightLbs);
  const a    = Number(age);
  const act  = Number(activity);
  const hCm  = ft * 30.48 + inch * 2.54;
  if (!(hCm > 0 && lbs > 0 && a > 0 && act > 0)) return null;

  const wKg  = lbs / 2.20462;
  const base = 10 * wKg + 6.25 * hCm - 5 * a;
  const bmr  = gender === "male" ? base + 5 : base - 161;
  return Math.round(bmr * act);
}

// — Weight plan —
// Returns { calories, dailyDeficit, lbsPerWeek, belowMinimum } or { error }.
export function calcPlan({ tdee, currentWeight, targetWeight, weeks, gender }) {
  const curr = Number(currentWeight);
  const targ = Number(targetWeight);
  const wks  = Number(weeks);
  if (!(tdee > 0))  return { error: "Calculate your TDEE first." };
  if (!(curr > 0))  return { error: "Enter your current weight in your profile." };
  if (!(targ > 0))  return { error: "Enter a target weight." };
  if (!(wks > 0))   return { error: "Enter a number of weeks." };

  const dailyDeficit = Math.round(((curr - targ) * KCAL_PER_LB) / (wks * 7));
  const calories     = tdee - dailyDeficit;
  const lbsPerWeek   = Math.round(((curr - targ) / wks) * 10) / 10;
  const min          = MIN_SAFE_CALORIES[gender] ?? MIN_SAFE_CALORIES.female;
  return { calories, dailyDeficit, lbsPerWeek, belowMinimum: calories < min, minimum: min };
}

// — Daily totals —
// Anything eaten over yesterday's goal is subtracted from today's goal.
export function dailySummary({ entries, prevEntries, targetCalories }) {
  const totalCal  = sum(entries, "calories");
  const totalProt = sum(entries, "protein");
  const prevCal   = sum(prevEntries, "calories");
  const hasGoal   = typeof targetCalories === "number" && targetCalories > 0;

  const carryover = hasGoal ? Math.max(0, prevCal - targetCalories) : 0;
  const goal      = hasGoal ? targetCalories - carryover : null;
  const remaining = hasGoal ? goal - totalCal : null;
  const percent   = hasGoal && goal > 0 ? Math.min(100, Math.round((totalCal / goal) * 100)) : null;
  return { totalCal, totalProt, carryover, goal, remaining, percent };
}

function sum(items, key) {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}
