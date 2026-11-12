"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { letterGrade, calculateAverage, validateCourse } = require("../app.js");

test("letter grade boundaries", () => {
  const cases = [
    [100, "A"], [90, "A"], [89.99, "B"], [80, "B"], [79.99, "C"],
    [70, "C"], [69.99, "D"], [60, "D"], [59.99, "F"], [0, "F"],
  ];
  for (const [score, letter] of cases) {
    assert.equal(letterGrade(score), letter, score + " should be " + letter);
  }
});

test("empty list has no average", () => {
  assert.equal(calculateAverage([]), null);
});

test("simple average of 92, 88, 76 is 85.33 (B)", () => {
  const list = [92, 88, 76].map((g) => ({ grade: g, credits: 1 }));
  const avg = calculateAverage(list);
  assert.equal(avg, 85.33);
  assert.equal(letterGrade(avg), "B");
});

test("weighted average: 100 (4 credits) and 60 (2 credits) is 86.67", () => {
  const avg = calculateAverage([{ grade: 100, credits: 4 }, { grade: 60, credits: 2 }]);
  assert.equal(avg, 86.67);
  assert.equal(letterGrade(avg), "B");
});

test("95 and 100 average to 97.5 (A)", () => {
  const avg = calculateAverage([{ grade: 95, credits: 1 }, { grade: 100, credits: 1 }]);
  assert.equal(avg, 97.5);
  assert.equal(letterGrade(avg), "A");
});

test("55 and 65 average to 60 (D)", () => {
  const avg = calculateAverage([{ grade: 55, credits: 1 }, { grade: 65, credits: 1 }]);
  assert.equal(avg, 60);
  assert.equal(letterGrade(avg), "D");
});

test("validateCourse accepts good input", () => {
  const r = validateCourse("Math", "88.5", "3");
  assert.equal(r.ok, true);
  assert.deepEqual(r.course, { name: "Math", grade: 88.5, credits: 3 });
});

test("empty credits default to 1", () => {
  assert.equal(validateCourse("Math", "80", "").course.credits, 1);
});

test("name is trimmed", () => {
  assert.equal(validateCourse("  Art  ", "80", "").course.name, "Art");
});

test("bad input gives an error", () => {
  assert.equal(validateCourse("", "80", "").ok, false);
  assert.equal(validateCourse("   ", "80", "").ok, false);
  assert.equal(validateCourse("x".repeat(41), "80", "").ok, false);
  assert.equal(validateCourse("Math", "", "").ok, false);
  assert.equal(validateCourse("Math", "abc", "").error, "The grade must be a number, like 85 or 92.5.");
  assert.equal(validateCourse("Math", "101", "").error, "The grade must be between 0 and 100.");
  assert.equal(validateCourse("Math", "-1", "").error, "The grade must be between 0 and 100.");
  assert.equal(validateCourse("Math", "80", "0").ok, false);
  assert.equal(validateCourse("Math", "80", "21").ok, false);
  assert.equal(validateCourse("Math", "80", "two").ok, false);
});

test("grade 0 and 100 are allowed", () => {
  assert.equal(validateCourse("A", "0", "").ok, true);
  assert.equal(validateCourse("A", "100", "").ok, true);
});
