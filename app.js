"use strict";

/* ==========================================================
   Grade Average Calculator
   Part 1: the logic (no page code here, so it is easy to test)
   Part 2: the page code (reads the form, draws the table)
   ========================================================== */

/* ---------- Part 1: logic ---------- */

// The grade scale. The first row that the score reaches wins.
const GRADE_SCALE = [
  { min: 90, letter: "A" },
  { min: 80, letter: "B" },
  { min: 70, letter: "C" },
  { min: 60, letter: "D" },
  { min: 0, letter: "F" },
];

const MAX_NAME_LENGTH = 40;
const MAX_CREDITS = 20;

// Turn a score (0 to 100) into a letter.
function letterGrade(score) {
  for (const step of GRADE_SCALE) {
    if (score >= step.min) return step.letter;
  }
  return "F";
}

// Round to 2 decimal places.
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Weighted average: add up (grade x credits), then divide by total credits.
// If every course has 1 credit, this is the normal average.
// Returns null when the list is empty.
function calculateAverage(courses) {
  if (courses.length === 0) return null;
  let points = 0;
  let credits = 0;
  for (const course of courses) {
    points += course.grade * course.credits;
    credits += course.credits;
  }
  return round2(points / credits);
}

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

// Check what the user typed. Returns { ok: true, course } or { ok: false, error }.
function validateCourse(nameText, gradeText, creditsText) {
  const name = String(nameText).trim();
  const grade = String(gradeText).trim();
  const credits = String(creditsText).trim();

  if (name === "") {
    return { ok: false, error: "Please enter a course name." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "The course name must be " + MAX_NAME_LENGTH + " characters or fewer." };
  }

  if (grade === "") {
    return { ok: false, error: "Please enter a grade." };
  }
  if (!NUMBER_PATTERN.test(grade)) {
    return { ok: false, error: "The grade must be a number, like 85 or 92.5." };
  }
  const gradeValue = Number(grade);
  if (gradeValue < 0 || gradeValue > 100) {
    return { ok: false, error: "The grade must be between 0 and 100." };
  }

  // Credits are optional. An empty box means 1 credit.
  let creditsValue = 1;
  if (credits !== "") {
    if (!NUMBER_PATTERN.test(credits)) {
      return { ok: false, error: "Credits must be a number, like 3." };
    }
    creditsValue = Number(credits);
    if (creditsValue <= 0 || creditsValue > MAX_CREDITS) {
      return { ok: false, error: "Credits must be more than 0 and at most " + MAX_CREDITS + "." };
    }
  }

  return { ok: true, course: { name: name, grade: gradeValue, credits: creditsValue } };
}

/* ---------- Part 2: the page ---------- */

const STORAGE_KEY = "gradeAverageCalculator.courses.v1";

// Read saved courses. If anything is wrong, start with an empty list.
function loadCourses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter(function (c) {
      return c && typeof c.name === "string" &&
        typeof c.grade === "number" && c.grade >= 0 && c.grade <= 100 &&
        typeof c.credits === "number" && c.credits > 0 &&
        typeof c.id === "number";
    });
  } catch (error) {
    return [];
  }
}

function saveCourses(courses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (error) {
    // Saving can fail in private mode. The app still works without it.
  }
}

function startApp() {
  const form = document.getElementById("course-form");
  const nameInput = document.getElementById("course-name");
  const gradeInput = document.getElementById("course-grade");
  const creditsInput = document.getElementById("course-credits");
  const message = document.getElementById("form-message");
  const tableBody = document.getElementById("course-rows");
  const averageView = document.getElementById("average-value");
  const letterView = document.getElementById("letter-value");
  const countView = document.getElementById("course-count");

  let courses = loadCourses();
  let nextId = courses.reduce(function (max, c) { return Math.max(max, c.id); }, 0) + 1;

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("error", Boolean(isError));
  }

  // Draw the table and the summary from the courses list.
  function render() {
    tableBody.textContent = "";

    if (courses.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "empty";
      cell.textContent = "No courses yet. Add your first course above.";
      row.appendChild(cell);
      tableBody.appendChild(row);
    }

    courses.forEach(function (course) {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = course.name;

      const gradeCell = document.createElement("td");
      gradeCell.textContent = String(course.grade);

      const creditsCell = document.createElement("td");
      creditsCell.textContent = String(course.credits);

      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", "Delete " + course.name);
      deleteButton.addEventListener("click", function () {
        courses = courses.filter(function (c) { return c.id !== course.id; });
        saveCourses(courses);
        showMessage("Deleted " + course.name + ".");
        render();
        nameInput.focus();
      });
      actionCell.appendChild(deleteButton);

      row.appendChild(nameCell);
      row.appendChild(gradeCell);
      row.appendChild(creditsCell);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });

    const average = calculateAverage(courses);
    if (average === null) {
      averageView.textContent = "-";
      letterView.textContent = "-";
    } else {
      averageView.textContent = average.toFixed(2);
      letterView.textContent = letterGrade(average);
    }
    countView.textContent = courses.length + (courses.length === 1 ? " course" : " courses");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const result = validateCourse(nameInput.value, gradeInput.value, creditsInput.value);

    if (!result.ok) {
      showMessage(result.error, true);
      return;
    }

    result.course.id = nextId;
    nextId += 1;
    courses.push(result.course);
    saveCourses(courses);
    showMessage("Added " + result.course.name + ".");
    render();

    form.reset();
    nameInput.focus();
  });

  render();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", startApp);
}

// Lets the tests load the logic with require().
if (typeof module !== "undefined" && module.exports) {
  module.exports = { letterGrade, calculateAverage, validateCourse, round2, GRADE_SCALE };
}
