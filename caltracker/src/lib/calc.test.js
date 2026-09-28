import {
  toDateStr,
  parseDateStr,
  shiftDateStr,
  dayBounds,
  calcTdee,
  calcPlan,
  dailySummary
} from "./calc";

describe("dates", () => {
  test("toDateStr uses the local day, not UTC", () => {
    // 11pm local would already be "tomorrow" with toISOString() in UTC-6.
    expect(toDateStr(new Date(2026, 8, 27, 23, 30))).toBe("2026-09-27");
  });

  test("parseDateStr round-trips", () => {
    expect(toDateStr(parseDateStr("2026-01-05"))).toBe("2026-01-05");
  });

  test("shiftDateStr crosses month and year boundaries", () => {
    expect(shiftDateStr("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDateStr("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("dayBounds covers the whole day", () => {
    const { start, end } = dayBounds("2026-09-27");
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(toDateStr(end)).toBe("2026-09-27");
  });
});

describe("calcTdee", () => {
  const profile = {
    heightFeet: "5", heightInches: "10", weightLbs: "180",
    age: "25", gender: "male", activity: "1.55"
  };

  test("matches Mifflin-St Jeor", () => {
    // 10*81.65 + 6.25*177.8 - 5*25 + 5 = 1807.7 → *1.55 ≈ 2802
    expect(calcTdee(profile)).toBe(2802);
  });

  test("female is 166 kcal lower BMR before activity", () => {
    const m = calcTdee({ ...profile, activity: "1" });
    const f = calcTdee({ ...profile, activity: "1", gender: "female" });
    expect(m - f).toBe(166);
  });

  test("returns null for missing inputs", () => {
    expect(calcTdee({ ...profile, weightLbs: "" })).toBeNull();
    expect(calcTdee({ ...profile, age: "0" })).toBeNull();
    expect(calcTdee({ ...profile, heightFeet: "", heightInches: "" })).toBeNull();
  });
});

describe("calcPlan", () => {
  test("10 lbs in 10 weeks is a 500 kcal/day deficit", () => {
    const p = calcPlan({ tdee: 2500, currentWeight: 180, targetWeight: 170, weeks: 10, gender: "male" });
    expect(p.dailyDeficit).toBe(500);
    expect(p.calories).toBe(2000);
    expect(p.lbsPerWeek).toBe(1);
    expect(p.belowMinimum).toBe(false);
  });

  test("flags aggressive plans below the safe minimum", () => {
    const p = calcPlan({ tdee: 2000, currentWeight: 180, targetWeight: 160, weeks: 4, gender: "female" });
    expect(p.belowMinimum).toBe(true);
    expect(p.minimum).toBe(1200);
  });

  test("a higher target gives a surplus", () => {
    const p = calcPlan({ tdee: 2500, currentWeight: 150, targetWeight: 160, weeks: 20, gender: "male" });
    expect(p.dailyDeficit).toBe(-250);
    expect(p.calories).toBe(2750);
  });

  test("returns an error instead of NaN for bad input", () => {
    expect(calcPlan({ tdee: null, currentWeight: 180, targetWeight: 170, weeks: 10 }).error).toBeTruthy();
    expect(calcPlan({ tdee: 2500, currentWeight: 180, targetWeight: 170, weeks: 0 }).error).toBeTruthy();
    expect(calcPlan({ tdee: 2500, currentWeight: "", targetWeight: 170, weeks: 5 }).error).toBeTruthy();
  });
});

describe("dailySummary", () => {
  const entries = [{ calories: 500, protein: 30 }, { calories: 700, protein: 40 }];

  test("totals calories and protein", () => {
    const s = dailySummary({ entries, prevEntries: [], targetCalories: 2000 });
    expect(s.totalCal).toBe(1200);
    expect(s.totalProt).toBe(70);
    expect(s.remaining).toBe(800);
    expect(s.percent).toBe(60);
  });

  test("carries yesterday's overage into today's goal", () => {
    const s = dailySummary({ entries, prevEntries: [{ calories: 2300 }], targetCalories: 2000 });
    expect(s.carryover).toBe(300);
    expect(s.goal).toBe(1700);
    expect(s.remaining).toBe(500);
  });

  test("no carryover when yesterday was under goal", () => {
    const s = dailySummary({ entries, prevEntries: [{ calories: 1500 }], targetCalories: 2000 });
    expect(s.carryover).toBe(0);
  });

  test("caps percent at 100 when over", () => {
    const s = dailySummary({ entries, prevEntries: [], targetCalories: 1000 });
    expect(s.remaining).toBe(-200);
    expect(s.percent).toBe(100);
  });

  test("no goal set", () => {
    const s = dailySummary({ entries, prevEntries: [], targetCalories: null });
    expect(s.goal).toBeNull();
    expect(s.remaining).toBeNull();
    expect(s.percent).toBeNull();
  });
});
