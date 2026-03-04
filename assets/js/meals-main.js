const API_URL = "https://www.themealdb.com/api/json/v1/1/";
let allMeals = [];
const MEALS_PER_PAGE = 6;
let currentChunkIndex = 0;

function loadAllMeals( ) {
    allMeals = [];
    fetch(`${API_URL}/search.php?f=a`)
        .then((response) => response.json())
        .then((data) => {
            allMeals = data.meals || [];
            displayMealsChunk();
        })
        .catch((error) => {
            console.error("Error loading meals:", error);
            alert("Failed to load meals. Please refresh the page.");
        })
        .finally(() => {
            document.getElementById('loaderScreen').classList.add('d-none');
        });
}



function displayMeals(meals, appendData = false) {
    let container = document.getElementById("mealsContainer");
    if (!appendData) {
        container.innerHTML = "";
    }

    if (meals.length === 0 && !appendData) {
        container.innerHTML = `<div class="col-12"><h3 class="text-center">No meals found.</h3></div>`;
        return;
    }

    const favorites = getFavorites(); // جلب المفضلة الحالية

    meals.forEach((meal) => {
        const isFavorite = favorites.includes(meal.idMeal); // التحقق مما إذا كانت الوجبة في المفضلة
        const col = document.createElement('div');
        col.className = "col-md-4 col-sm-6 mb-4";
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <!-- أيقونة القلب الجديدة -->
                <i 
                    class="fas fa-heart favorite-icon ${isFavorite ? 'active' : ''}" 
                    onclick="toggleFavorite('${meal.idMeal}', event)"
                    title="Add to favorites"
                ></i>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="card-img-top" style="height: 250px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${meal.strMeal}</h5>
                    <p class="card-text text-muted">${meal.strCategory || "N/A"}</p>
                    <button class="btn btn-primary mt-auto" onclick="showMealDetails('${meal.idMeal}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}


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

    if (endIndex >= allMeals.length) {
        document.getElementById("loadMoreBtn").classList.add("d-none");
    } else {
        document.getElementById("loadMoreBtn").classList.remove("d-none");
    }
}

function searchMeals(searchTerm) {
    let cleanedSearchTerm = sanitizeData(searchTerm);
    if (!cleanedSearchTerm) {
        currentChunkIndex = 0;
        loadAllMeals();
        return;
    }

    fetch(`${API_URL}/search.php?s=${encodeURIComponent(cleanedSearchTerm)}`)
        .then((response) => response.json())
        .then((data) => {
            allMeals = data.meals || [];
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch((error) => console.error("Error searching meals:", error));
}

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
                </div>
                <hr>
                <div class="mb-4"><h3>Ingredients</h3><ul class="list-group">${ingredientsList}</ul></div>
                <div><h3>Instructions</h3><p style="white-space: pre-line;">${meal.strInstructions}</p></div>
                ${meal.strYoutube ? `<div class="mt-4"><a href="${meal.strYoutube}" target="_blank" class="btn btn-danger"><i class="fab fa-youtube me-2"></i>Watch on YouTube</a></div>` : ''}
            `;
        } else {
            mealDetailsContent.innerHTML = '<p class="text-center text-danger">Meal details not found.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch meal details:', error);
        mealDetailsContent.innerHTML = '<p class="text-center text-danger">Failed to load details. Please try again later.</p>';
    }
}

function sanitizeData(input) {
    return input.trim().replace(/[<>]/g, "");
}

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDark);
    const icon = document.getElementById("darkModeIcon");
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function loadDarkMode() {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
        document.body.classList.add("dark-mode");
        const icon = document.getElementById("darkModeIcon");
        if (icon) {
            icon.className = "fas fa-sun";
        }
    }
}

function filterMealsByArea(area) {
    if (!area || area === "") {
        currentChunkIndex = 0;
        loadAllMeals();
        return;
    }
    document.getElementById('loaderScreen').classList.remove('d-none');
    fetch(`${API_URL}filter.php?a=${encodeURIComponent(area)}`)
        .then(response => response.json())
        .then(data => {
            allMeals = data.meals || [];
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch(error => console.error(`Error filtering by area ${area}:`, error))
        .finally(() => document.getElementById('loaderScreen').classList.add('d-none'));
}

function loadAreas() {
    fetch(`${API_URL}list.php?a=list`)
        .then(response => response.json())
        .then(data => {
            const areas = data.meals || [];
            const areaFilter = document.getElementById('areaFilter');
            if (areaFilter) {
                areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.strArea;
                    option.textContent = `  ${area.strArea}`;
                    areaFilter.appendChild(option);
                });
            }
        })
        .catch(error => console.error("Failed to load areas:", error));
}


// أضف هذه الدوال في meals-main.js

function getFavorites() {
    const favorites = localStorage.getItem('mealFavorites');
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('mealFavorites', JSON.stringify(favorites));
}

function toggleFavorite(mealId, event) {
    event.stopPropagation(); // منع الفقاعات لعدم فتح صفحة التفاصيل
    
    let favorites = getFavorites();
    const favoriteIcon = event.target;

    if (favorites.includes(mealId)) {
        // إزالة من المفضلة
        favorites = favorites.filter(id => id !== mealId);
        favoriteIcon.classList.remove('active');
    } else {
        // إضافة إلى المفضلة
        favorites.push(mealId);
        favoriteIcon.classList.add('active');
    }
    
    saveFavorites(favorites);
}
// أضف هذه الدالة في meals-main.js

function showFavoriteMeals() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        alert("You have no favorite meals yet!");
        return;
    }

    document.getElementById('loaderScreen').classList.remove('d-none');
    
    // جلب تفاصيل كل وجبة مفضلة
    const mealPromises = favorites.map(id => 
        fetch(`${API_URL}lookup.php?i=${id}`).then(res => res.json())
    );

    Promise.all(mealPromises)
        .then(results => {
            // استخلاص الوجبات من النتائج
            allMeals = results.map(result => result.meals[0]);
            currentChunkIndex = 0;
            displayMealsChunk();
        })
        .catch(error => console.error("Error fetching favorites:", error))
        .finally(() => document.getElementById('loaderScreen').classList.add('d-none'));
}


window.addEventListener("DOMContentLoaded", function () {
    loadDarkMode();
    loadAllMeals();
    loadAreas();

    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const searchTerm = document.getElementById("searchInput").value;
            searchMeals(searchTerm);
        });
    }

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            const mainContent = document.getElementById('mainContent');
            const mealDetailsPage = document.getElementById('mealDetailsPage');
            if (mealDetailsPage) mealDetailsPage.classList.add('d-none');
            if (mainContent) mainContent.classList.remove('d-none');
        });
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) {
        areaFilter.addEventListener('change', function() {
            const selectedArea = this.value;
            filterMealsByArea(selectedArea);
        });
    }
    // داخل window.addEventListener("DOMContentLoaded", ...)

// أضف هذا المستمع الجديد
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
if (showFavoritesBtn) {
    showFavoritesBtn.addEventListener('click', showFavoriteMeals);
}

});
