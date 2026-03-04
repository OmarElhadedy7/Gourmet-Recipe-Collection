// ============================================
// 1. Global Variables & API Configuration
// ============================================
const API_URL = "https://www.themealdb.com/api/json/v1/1/";
let allMeals = [];
const MEALS_PER_PAGE = 6;
let currentChunkIndex = 0;
let isFavoritesView = false;

// ============================================
// 2. loadAllMeals
// ============================================
function loadAllMeals( ) {
    isFavoritesView = false;
    const collectionHeader = document.getElementById('collectionHeader');
    if (collectionHeader) {
        collectionHeader.innerHTML = `<h2><i class="fas fa-utensils me-2"></i>Our Menu Collection</h2>`;
    }
    document.getElementById('loaderScreen').classList.remove('d-none');

    fetch(`${API_URL}/search.php?f=a`)
        .then((response) => response.json())
        .then((data) => {
            allMeals = data.meals || [];
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch((error) => console.error("Error loading meals:", error))
        .finally(() => document.getElementById('loaderScreen').classList.add('d-none'));
}

// ============================================
// 3. displayMeals
// ============================================
function displayMeals(meals, appendData = false) {
    const container = document.getElementById("mealsContainer");
    if (!appendData) container.innerHTML = "";

    if (meals.length === 0 && !appendData) {
        const message = isFavoritesView ? "You have no favorite meals yet." : "No meals found.";
        container.innerHTML = `<div class="col-12"><h3 class="text-center">${message}</h3></div>`;
        return;
    }

    const favorites = getFavorites();
    meals.forEach((meal) => {
        if (!meal) return;
        const isFavorite = favorites.includes(meal.idMeal);
        const col = document.createElement('div');
        col.className = "col-md-4 col-sm-6 mb-4";
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <i class="fas fa-heart favorite-icon ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${meal.idMeal}', event)" title="Add to favorites"></i>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="card-img-top">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${meal.strMeal}</h5>
                    <p class="card-text text-muted">${meal.strCategory || "N/A"}</p>
                    <button class="btn btn-primary mt-auto" onclick="showMealDetails('${meal.idMeal}')">View Details</button>
                </div>
            </div>`;
        container.appendChild(col);
    });
}

// ============================================
// 4. displayMealsChunk
// ============================================
function displayMealsChunk() {
    const startIndex = currentChunkIndex * MEALS_PER_PAGE;
    const endIndex = startIndex + MEALS_PER_PAGE;
    const chunk = allMeals.slice(startIndex, endIndex);

    if (chunk.length === 0 && currentChunkIndex === 0) {
        document.getElementById("loadMoreBtn").classList.add("d-none");
        displayMeals([], false);
        return;
    }
    displayMeals(chunk, currentChunkIndex > 0);
    document.getElementById("loadMoreBtn").classList.toggle('d-none', endIndex >= allMeals.length);
}

// ============================================
// 5. loadMoreMeals
// ============================================
function loadMoreMeals() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = "Loading...";
    }
    setTimeout(() => {
        currentChunkIndex++;
        displayMealsChunk();
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = "Load More Recipes";
        }
    }, 300);
}

// ============================================
// 6. showMealDetails
// ============================================
async function showMealDetails(mealId) {
    if (!mealId) return;
    const mainContent = document.getElementById('mainContent');
    const mealDetailsPage = document.getElementById('mealDetailsPage');
    const mealDetailsContent = document.getElementById('mealDetailsContent');
    mealDetailsContent.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';
    if (mainContent) mainContent.classList.add('d-none');
    if (mealDetailsPage) mealDetailsPage.classList.remove('d-none');

    try {
        const response = await fetch(`${API_URL}lookup.php?i=${mealId}`);
        const data = await response.json();
        const meal = data.meals[0];
        if (meal) {
            let ingredientsList = '';
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                if (ingredient && ingredient.trim() !== '') {
                    ingredientsList += `<li class="list-group-item">${ingredient} - ${measure}</li>`;
                }
            }
            mealDetailsContent.innerHTML = `
                <div class="row">
                    <div class="col-md-4 mb-4"><img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid rounded"></div>
                    <div class="col-md-8">
                        <h2>${meal.strMeal}</h2>
                        <p><strong>Category:</strong> ${meal.strCategory}</p>
                        <p><strong>Area:</strong> ${meal.strArea}</p>
                    </div>
                </div><hr>
                <div class="mb-4"><h3>Ingredients</h3><ul class="list-group">${ingredientsList}</ul></div>
                <div><h3>Instructions</h3><p style="white-space: pre-line;">${meal.strInstructions}</p></div>
                <div class="mt-4 d-flex gap-2">
                    ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="btn btn-danger"><i class="fab fa-youtube me-2"></i>Watch</a>` : ''}
                    <button class="btn btn-info" onclick="shareMeal('${meal.idMeal}')"><i class="fas fa-share-alt me-2"></i>Share</button>
                </div>`;
        } else {
            mealDetailsContent.innerHTML = '<p class="text-center text-danger">Meal details not found.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch meal details:', error);
        mealDetailsContent.innerHTML = '<p class="text-center text-danger">Failed to load details.</p>';
    }
}

// ============================================
// 7. Search & Filter Functions
// ============================================
function searchMeals(searchTerm) {
    const cleanedSearchTerm = sanitizeData(searchTerm);
    if (!cleanedSearchTerm) {
        loadAllMeals();
        return;
    }
    fetchAndDisplay(`${API_URL}/search.php?s=${encodeURIComponent(cleanedSearchTerm)}`);
}

function filterMealsByArea(area) {
    if (!area) {
        loadAllMeals();
        return;
    }
    fetchAndDisplay(`${API_URL}filter.php?a=${encodeURIComponent(area)}`);
}

function filterMealsByCategory(category) {
    if (!category) {
        loadAllMeals();
        return;
    }
    fetchAndDisplay(`${API_URL}filter.php?c=${encodeURIComponent(category)}`);
}

function fetchAndDisplay(url) {
    isFavoritesView = false;
    const collectionHeader = document.getElementById('collectionHeader');
    if (collectionHeader) {
        collectionHeader.innerHTML = `<h2><i class="fas fa-utensils me-2"></i>Our Menu Collection</h2>`;
    }
    document.getElementById('loaderScreen').classList.remove('d-none');
    fetch(url)
        .then(response => response.json())
        .then(data => {
            allMeals = data.meals || [];
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch(error => console.error("Error fetching data:", error))
        .finally(() => document.getElementById('loaderScreen').classList.add('d-none'));
}

// ============================================
// 8. Favorite Meals Functions
// ============================================
function getFavorites() {
    return JSON.parse(localStorage.getItem('mealFavorites') || '[]');
}

function saveFavorites(favorites) {
    localStorage.setItem('mealFavorites', JSON.stringify(favorites));
}

function toggleFavorite(mealId, event) {
    event.stopPropagation();
    let favorites = getFavorites();
    const favoriteIcon = event.target;
    if (favorites.includes(mealId)) {
        favorites = favorites.filter(id => id !== mealId);
        favoriteIcon.classList.remove('active');
        if (isFavoritesView) {
            allMeals = allMeals.filter(meal => meal.idMeal !== mealId);
            displayMealsChunk();
        }
    } else {
        favorites.push(mealId);
        favoriteIcon.classList.add('active');
    }
    saveFavorites(favorites);
}

function showFavoriteMeals() {
    isFavoritesView = true;
    const collectionHeader = document.getElementById('collectionHeader');
    if (collectionHeader) {
        collectionHeader.innerHTML = `
            <button class="btn btn-secondary mb-4" id="backToHomeBtn">
                <i class="fas fa-arrow-left me-2"></i>Back to All Meals
            </button>
        `;
        document.getElementById('backToHomeBtn')?.addEventListener('click', loadAllMeals);
    }

    const favorites = getFavorites();
    if (favorites.length === 0) {
        allMeals = [];
        displayMealsChunk();
        return;
    }

    document.getElementById('loaderScreen').classList.remove('d-none');
    const mealPromises = favorites.map(id => fetch(`${API_URL}lookup.php?i=${id}`).then(res => res.json()));
    Promise.all(mealPromises)
        .then(results => {
            allMeals = results.map(result => result.meals[0]);
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch(error => console.error("Error fetching favorites:", error))
        .finally(() => document.getElementById('loaderScreen').classList.add('d-none'));
}

// ============================================
// 9. Utility & UI Functions
// ============================================
function sanitizeData(input) {
    return input.trim().replace(/[<>]/g, "");
}

function shareMeal(mealId) {
    const mealUrl = `${window.location.origin}${window.location.pathname}?meal=${mealId}`;
    navigator.clipboard.writeText(mealUrl)
        .then(() => alert("Recipe link copied to clipboard!"))
        .catch(err => console.error('Failed to copy link: ', err));
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDark);
    document.getElementById("darkModeIcon").className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function loadDarkMode() {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
        const icon = document.getElementById("darkModeIcon");
        if (icon) icon.className = "fas fa-sun";
    }
}

function loadAreas() {
    fetch(`${API_URL}list.php?a=list`).then(response => response.json()).then(data => {
        const areaFilter = document.getElementById('areaFilter');
        if (areaFilter) {
            (data.meals || []).forEach(area => {
                const option = document.createElement('option');
                option.value = area.strArea;
                option.textContent = `🌍 ${area.strArea}`;
                areaFilter.appendChild(option);
            });
        }
    });
}

function loadCategories() {
    fetch(`${API_URL}list.php?c=list`).then(response => response.json()).then(data => {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            (data.meals || []).forEach(category => {
                if (category.strCategory) {
                    const option = document.createElement('option');
                    option.value = category.strCategory;
                    option.textContent = `🍲 ${category.strCategory}`;
                    categoryFilter.appendChild(option);
                }
            });
        }
    });
}

// ============================================
// 10. DOMContentLoaded - Event Listeners
// ============================================
window.addEventListener("DOMContentLoaded", function () {
    loadDarkMode();
    loadAreas();
    loadCategories();

    const urlParams = new URLSearchParams(window.location.search);
    const mealIdFromUrl = urlParams.get('meal');
    if (mealIdFromUrl) {
        showMealDetails(mealIdFromUrl);
    } else {
        loadAllMeals();
    }

    document.getElementById("searchForm")?.addEventListener("submit", function (e) {
        e.preventDefault();
        document.getElementById('areaFilter').value = "";
        document.getElementById('categoryFilter').value = "";
        searchMeals(document.getElementById("searchInput").value);
    });

    document.getElementById('backButton')?.addEventListener('click', () => {
        document.getElementById('mealDetailsPage')?.classList.add('d-none');
        document.getElementById('mainContent')?.classList.remove('d-none');
    });

    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    document.getElementById('showFavoritesBtn')?.addEventListener('click', showFavoriteMeals);

    document.getElementById('areaFilter')?.addEventListener('change', function () {
        document.getElementById('categoryFilter').value = "";
        document.getElementById('searchInput').value = "";
        filterMealsByArea(this.value);
    });

    document.getElementById('categoryFilter')?.addEventListener('change', function () {
        document.getElementById('areaFilter').value = "";
        document.getElementById('searchInput').value = "";
        filterMealsByCategory(this.value);
    });
});
