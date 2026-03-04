// ============================================
// Simple Meal Recipe App
// ============================================

// https://www.themealdb.com/api/json/v1/1/search.php?f=a
// https://www.themealdb.com/api/json/v1/1/list.php?a=list
// https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772

// API Configuration
const API_URL = "https://www.themealdb.com/api/json/v1/1/";
let allMeals = [];
const MEALS_PER_PAGE = 6;
let currentChunkIndex = 0;

// ============================================
// Function 1: Load All Meals on Page Load
// ============================================
/**
 * Load all meals when page loads
 * Uses Fetch API with Promises
 * Only loads meals starting with letter 'a'
 */

function loadAllMeals() {
  allMeals = [];
  fetch(`${API_URL}/search.php?f=a`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data.meals)
      const meals = data.meals || [];
      allMeals = meals;

      //  displayMeals(allMeals);
      displayMealsChunk();
    })
    .catch((error) => {
      console.error("Error loading meals:", error);
     alert("Failed to load meals. Please refresh the page.");
    })
    .finally(() => {
        document.getElementById("loaderScreen").classList.add("d-none")
    });
}

// ============================================
// Function 2: Display Meals
// ============================================
/**
 * Display meals in the container
 * DOM Manipulation
 * @param {Array} meals - Array of meal objects
 */

function displayMeals(meals, appendData = false) {
  // console.log("hello displayMeals: ", meals)

  let container = document.getElementById("mealsContainer");
  if (!appendData) {
    container.innerHTML = "";
  }

  if (meals.length === 0 && !appendData) {
    container.innerHTML = `
    <div class="col-12"><h3 class="text-center">No meals found.</h3></div>
    `;
    return;
  }

  meals.forEach((meal) => {
    const col = document.createElement("div");
    col.className = "col-md-4 col-sm-6 mb-4";

    col.innerHTML = `
    <div class="card h-100 shadow-sm">
        <img src="${meal.strMealThumb}"
            alt="${meal.strMeal}" class="card-img-top" style="height: 250px; object-fit: cover;">
        <div class="card-body">
            <h5 class="card-title">${meal.strMeal}</h5>
            <p class="card-text text-muted">${meal.strCategory || "N/A"}</p>
            <button class="btn btn-primary"  onclick="showMealDetails(${meal.idMeal})">
                View Details
            </button>
        </div>
    </div>
    `;
    container.appendChild(col);
  });
}

// ============================================
// Function 3: Display Meals Chunk (6 meals)
// ============================================

/**
 * Display meals in chunks of 6
 */

function displayMealsChunk() {
  const startIndex = currentChunkIndex * MEALS_PER_PAGE; // 0 * 6 = 0
  const endIndex = startIndex + MEALS_PER_PAGE; // 0 +6 = 6

  const chunk = allMeals.slice(startIndex, endIndex);

  if (chunk.length === 0) {
    document.getElementById("loadMoreBtn").classList.add("d-none");
    return;
  }

  displayMeals(chunk, currentChunkIndex > 0);

  if (endIndex >= allMeals.length) {
    document.getElementById("loadMoreBtn").classList.add("d-none");
  } else {
    document.getElementById("loadMoreBtn").classList.remove("d-none");
  }
}

// ============================================
// Function 4: Search Meals
// ============================================

/**
 * Search for meals by name
 * @param {string} searchTerm - The meal name to search for
 */
function searchMeals(searchTerm) {
  //   console.log("searchTerm", searchTerm)

  let cleanedSearchTerm = sanitizeData(searchTerm);
  if (!cleanedSearchTerm) {
    currentChunkIndex = 0;
    displayMealsChunk();
    document.getElementById("loadMoreBtn").style.display = "block";
    return;
  }

  //search.php?s=Arrabiata

  fetch(`${API_URL}/search.php?s=${encodeURIComponent(cleanedSearchTerm)}`)
    .then((response) => response.json())
    .then((data) => {
      const meals = data.meals || [];
      allMeals = meals;
      currentChunkIndex = 0;
      displayMealsChunk();
    })
    .catch((error) => {
      console.error("Error loading meals:", error);
    })
    .finally(() => {
     document.getElementById("loaderScreen").classList.add("d-none")
    });
}

// ============================================
// Function 5: Load More Meals
// ============================================

/**
 * Load more meals from array chunks (6 by 6)
 * Simple function for beginners
 */

function loadMoreMeals() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerText = "Loading...";
  }

  setTimeout(() => {
    currentChunkIndex++;
    displayMealsChunk();
    loadMoreBtn.disabled = false;
    loadMoreBtn.innerText = "Load More Recipes";
  }, 300);
}

// ============================================
// Function 6: Show Meal Details
// ============================================

/**
 * Show meal details page
 * Navigates to details page
 * @param {string} mealId - The meal ID
 *
 * https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772
 */

function showMealDetails(mealId) {
  console.log("meal id is: ", mealId);
}

// ============================================
// Function 7:sanitizeData to validate the input data
// ============================================

function sanitizeData(input) {
  return input.trim().replace(/[<>]/g, "");
}

// ============================================
// Function 8: Toggle Dark Mode
// ============================================

/**
 * Toggle dark mode and save to localStorage
 * BOM - localStorage usage
 */
function toggleDarkMode() {
  const body = document.body;
  const isDark = body.classList.toggle("dark-mode");
  // console.log("isDark", isDark)
  localStorage.setItem("darkMode", isDark);

  //update icon
  const icon = document.getElementById("darkModeIcon");
  icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

/**
 * Load dark mode preference from localStorage
 */
function loadDarkMode() {
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "true") {
    document.body.classList.add("dark-mode");
    document.getElementById("darkModeIcon").classList = "fas fa-sun"
  }
}

window.addEventListener("DOMContentLoaded", function () {
  loadAllMeals();
  loadDarkMode();
  /*------------------------ */
  let searchForm = document.getElementById("searchForm");
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const searchTerm = document.getElementById("searchInput").value;
    searchMeals(searchTerm);
  });
  /*------------------------ */
  document
    .getElementById("darkModeToggle")
    .addEventListener("click", toggleDarkMode);

  /*------------------------ */
});




// how to host site in git
// https://www.youtube.com/watch?si=g0LI2C798gyPMMXk&v=e5AwNU3Y2es&feature=youtu.be