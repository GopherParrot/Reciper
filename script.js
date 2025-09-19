const mainTitle = document.getElementById('main-title');
const descriptionText = document.getElementById('description-text');
const inputSection = document.getElementById('input-section');
const ingredientsInput = document.getElementById('ingredients');
const generateRecipeBtn = document.getElementById('generate-recipe-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const buttonText = document.getElementById('button-text');
const errorMessage = document.getElementById('error-message');
const thinkingSection = document.getElementById('thinking-section');

const generatedRecipesSection = document.getElementById('generated-recipes-section');
const generatedRecipesContent = document.getElementById('generated-recipes-content');
const noRecipesMessage = document.getElementById('no-recipes-message');

const recipeModal = document.getElementById('recipe-modal');
const modalRecipeName = document.getElementById('modal-recipe-name');
const modalIngredients = document.getElementById('modal-ingredients');
const modalInstructions = document.getElementById('modal-instructions');
const closeRecipeModalBtn = document.getElementById('close-recipe-modal-btn');

const successModal = document.getElementById('success-modal');
const closeSuccessModalBtn = document.getElementById('close-success-modal-btn');

let savedRecipes = [];

const deliciousPhrases = [
    "Make something delicious!",
    "Whip up something tasty!",
    "Create a culinary masterpiece!",
    "Cook up a storm!",
    "Prepare a delightful dish!",
    "Craft a flavorful meal!",
    "Bake something scrumptious!",
    "Savor a new recipe!",
    "Explore your inner chef!",
    "Unleash your culinary creativity!",
    "Discover amazing flavors!",
    "Get cooking with AI!",
    "Taste the possibilities!",
    "Your next meal awaits!",
    "Let's get cooking!",
    "Time to create magic in the kitchen!",
    "Find your next favorite dish!",
    "Inspiring delicious moments!",
    "Cooking made easy!",
    "From ingredients to indulgence!"
];
let currentPhraseIndex = 0;

function animateDescriptionPhrases() {
    descriptionText.classList.remove('animate-slide-in-up-fade-in');
    descriptionText.classList.add('animate-slide-out-down-fade-out');

    setTimeout(() => {
        currentPhraseIndex = Math.floor(Math.random() * deliciousPhrases.length);
        descriptionText.textContent = deliciousPhrases[currentPhraseIndex];

        descriptionText.classList.remove('animate-slide-out-down-fade-out');
        descriptionText.classList.add('animate-slide-in-up-fade-in');
    }, 500);

    setTimeout(animateDescriptionPhrases, 3000);
}

window.onload = () => {
    mainTitle.classList.add('animate-fade-slide-up');

    setTimeout(() => {
        currentPhraseIndex = Math.floor(Math.random() * deliciousPhrases.length);
        descriptionText.textContent = deliciousPhrases[currentPhraseIndex];
        descriptionText.classList.add('animate-fade-slide-up');

        setTimeout(() => {
            animateDescriptionPhrases();
        }, 2000);
    }, 800);

    setTimeout(() => {
        inputSection.classList.add('animate-fade-slide-up');
    }, 1500);

    renderGeneratedRecipes();
};
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}
function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}
function setLoading(isLoading) {
    if (isLoading) {
        inputSection.classList.add('hidden');
        thinkingSection.classList.remove('hidden');
    }
    else {
        inputSection.classList.remove('hidden');
        thinkingSection.classList.add('hidden');
    }
    generateRecipeBtn.disabled = isLoading;
    ingredientsInput.disabled = isLoading;
}

generateRecipeBtn.addEventListener('click', async () => {
    const ingredients = ingredientsInput.value.trim();
    if (!ingredients) {
        displayError("Please enter some ingredients.");
        return;
    }

    setLoading(true);
    clearError();

    try {
        const prompt = `Generate up to 5 detailed recipes based on the following ingredients.
        Provide the output as a JSON array of objects, where each object has the following structure:
        {
          "recipeName": "string",
          "ingredients": ["string", "string", ...],
          "instructions": ["string", "string", ...]
        }
        Ingredients: ${ingredients}
        `;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            recipeName: { type: "STRING" },
                            ingredients: { type: "ARRAY", items: { type: "STRING" } },
                            instructions: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        required: ["recipeName", "ingredients", "instructions"]
                    }
                }
            }
        };

        const apiKey = "AIzaSyA0DRATrqr9lLwHhUkxF9l_ARUPmr4F-vM";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            const generatedRecipes = JSON.parse(jsonString);

            if (Array.isArray(generatedRecipes) && generatedRecipes.length > 0) {
                const generationTime = new Date();
                generatedRecipes.forEach(recipe => {
                    savedRecipes.unshift({
                        ...recipe,
                        timestamp: generationTime
                    });
                });

                renderGeneratedRecipes();
                viewRecipe(generatedRecipes[0]);
                showSuccessMessage();
                ingredientsInput.value = '';
            }
            else {
                displayError("The AI did not generate any valid recipes. Please try again.");
            }
        }

        else {
            displayError("Could not generate recipes. Please try again or rephrase your ingredients.");
            console.error("Unexpected API response structure:", result);
        }
    }
    catch (err) {
        console.error("Error generating recipe:", err);
        displayError("An error occurred while generating the recipes. Please try again.");
    }
    finally {
        setLoading(false);
    }
});

function renderGeneratedRecipes() {
    generatedRecipesContent.innerHTML = '';

    if (savedRecipes.length === 0) {
        noRecipesMessage.classList.remove('hidden');
        generatedRecipesContent.appendChild(noRecipesMessage);
        return;
    }

    else {
        noRecipesMessage.classList.add('hidden');
    }

    const groupedRecipes = savedRecipes.reduce((acc, recipe) => {
        const date = new Date(recipe.timestamp);
        const timeKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        if (!acc[timeKey]) {
            acc[timeKey] = [];
        }
        acc[timeKey].push(recipe);
        return acc;
    }, {});

    const sortedTimeKeys = Object.keys(groupedRecipes).sort((a, b) => {
        const timeA = new Date(`2000/01/01 ${a}`);
        const timeB = new Date(`2000/01/01 ${b}`);
        return timeB - timeA;
    });

    sortedTimeKeys.forEach(timeKey => {
        const timeGroupDiv = document.createElement('div');
        timeGroupDiv.className = 'mb-6';

        const timeHeader = document.createElement('h3');
        timeHeader.className = 'text-xl font-bold text-gray-700 mb-3 border-b pb-2';
        timeHeader.textContent = `Generated at ${timeKey}`;
        timeGroupDiv.appendChild(timeHeader);

        const recipesGrid = document.createElement('div');
        recipesGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

        groupedRecipes[timeKey].forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'bg-purple-50 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-purple-100 flex flex-col justify-between';
            recipeCard.addEventListener('click', () => viewRecipe(recipe));

            const ingredientsPreview = recipe.ingredients && recipe.ingredients.length > 0
                ? `Ingredients: ${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}`
                : 'No ingredients listed.';

            recipeCard.innerHTML = `
                <div>
                    <h4 class="text-lg font-semibold text-purple-800 mb-1">
                        ${recipe.recipeName || 'Untitled Recipe'}
                    </h4>
                    <p class="text-sm text-gray-600">
                        ${ingredientsPreview}
                    </p>
                </div>
            `;
            recipesGrid.appendChild(recipeCard);
        });
        timeGroupDiv.appendChild(recipesGrid);
        generatedRecipesContent.appendChild(timeGroupDiv);
    });
}

function viewRecipe(recipe) {
    modalRecipeName.textContent = recipe.recipeName || 'Untitled Recipe';

    modalIngredients.innerHTML = '';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            modalIngredients.appendChild(li);
        });
    }

    else {
        modalIngredients.innerHTML = '<li>No ingredients listed.</li>';
    }

    modalInstructions.innerHTML = '';
    if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            modalInstructions.appendChild(li);
        });
    }

    else {
        modalInstructions.innerHTML = '<li>No instructions provided.</li>';
    }

    recipeModal.classList.remove('hidden');
    recipeModal.querySelector('div').classList.remove('opacity-0', 'scale-95');
    recipeModal.querySelector('div').classList.add('modal-content-animated');
}

closeRecipeModalBtn.addEventListener('click', () => {
    recipeModal.querySelector('div').classList.add('opacity-0', 'scale-95');
    recipeModal.querySelector('div').classList.remove('modal-content-animated');
    setTimeout(() => {
        recipeModal.classList.add('hidden');
    }, 300);
});

recipeModal.addEventListener('click', (e) => {
    if (e.target === recipeModal) {
        closeRecipeModalBtn.click();
    }
});

function showSuccessMessage() {
    successModal.classList.remove('hidden');
    successModal.querySelector('div').classList.remove('opacity-0', 'scale-95');
    successModal.querySelector('div').classList.add('modal-content-animated');
}

closeSuccessModalBtn.addEventListener('click', () => {
    successModal.querySelector('div').classList.add('opacity-0', 'scale-95');
    successModal.querySelector('div').classList.remove('modal-content-animated');
    setTimeout(() => {
        successModal.classList.add('hidden');
    }, 300);
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeSuccessModalBtn.click();
    }
});

