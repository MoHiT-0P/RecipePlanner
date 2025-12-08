import React, { useState, useEffect, useRef } from 'react';
import { 
    Frown, 
    Search, 
    X, 
    Filter, 
    XCircle, 
    Bookmark, 
    Clock, 
    Zap, 
    Download, 
    PlusCircle, 
    CalendarPlus,
    Calendar,
    Utensils,
    Users, // <-- ADDED
    Plus   // <-- ADDED
} from 'lucide-react';

// --- (Helper Function from ../utils/helpers.js) ---
const cleanIngredient = (ingredient) => {
    if (typeof ingredient !== 'string') return '';
    return ingredient.toLowerCase().trim();
};

// --- (Component from ../components/RecipeCard.jsx) ---
const RecipeCard = ({ recipe, onSelect, isSaved, onSave }) => {
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer">
            <div onClick={onSelect}>
                <img 
                    src={recipe.imageUrl || 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'} 
                    alt={recipe.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'; }}
                />
                <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{recipe.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 h-10">{recipe.description || 'No description available.'}</p>
                    
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Clock size={16} className="mr-1.5" />
                            {recipe.cookTime || 'N/A'} min
                        </span>
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Zap size={16} className="mr-1.5" />
                            {recipe.totalCalories || 'N/A'} kcal
                        </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onSave();
                }}
                className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isSaved ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm'}`}
            >
                <Bookmark size={18} />
            </button>
        </div>
    );
};


// --- (NEWLY UPDATED MODAL CODE) ---
// This code is copied from your working `src/components/RecipeDetailModal.jsx`
// to ensure the Recipe Generator page uses the same, correct modal.

// --- AddToPlanModal (Internal Component) ---
const AddToPlanModal = ({ onLogMealSubmit, onClose }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [mealType, setMealType] = useState('Breakfast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const planDate = new Date(selectedDate + 'T00:00:00');
        const beginningOfToday = new Date();
        beginningOfToday.setHours(0, 0, 0, 0);

        if (planDate < beginningOfToday) {
            setError("Cannot add meals to past dates.");
            setLoading(false);
            return;
        }

        try {
            await onLogMealSubmit(selectedDate, mealType);
            onClose(); // Close this modal on success
        } catch (err) {
            console.error("Error in onLogMealSubmit callback: ", err);
            setError("Failed to add meal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add to Meal Plan</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="meal-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Calendar className="text-gray-400" size={20}/></span>
                            <input
                                type="date"
                                id="meal-date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                                min={today}
                                className="w-full pl-10 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-gray-200"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="meal-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meal</label>
                         <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Utensils className="text-gray-400" size={20}/></span>
                            <select
                                id="meal-type"
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value)}
                                required
                                className="w-full pl-10 p-2 border rounded-lg appearance-none bg-transparent dark:border-gray-600 dark:text-gray-200"
                            >
                                <option>Breakfast</option>
                                <option>Lunch</option>
                                <option>Dinner</option>
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Adding...' : 'Add Meal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main RecipeDetailModal Component (Internal) ---
const RecipeDetailModal = ({ recipe, onClose, onLogMeal }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showAddToPlan, setShowAddToPlan] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const { default: jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.es.min.js');
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.text(recipe.title, 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Cuisine: ${recipe.cuisine}`, 20, 30);
            doc.text(`Difficulty: ${recipe.difficulty}`, 20, 37);
            doc.text(`Total Time: ${recipe.totalTime} minutes`, 20, 44);
            doc.text(`Servings: ${recipe.servings}`, 20, 51);
            doc.text(`Calories: ${recipe.totalCalories} kcal`, 20, 58);

            doc.setFontSize(16);
            doc.text("Ingredients:", 20, 70);
            let y = 78;
            recipe.ingredients.forEach(ing => {
                const text = typeof ing === 'object' ? ing.original : ing;
                doc.text(`- ${text}`, 20, y);
                y += 7;
                if (y > 280) { doc.addPage(); y = 20; }
            });

            y += 5;
            doc.setFontSize(16);
            doc.text("Instructions:", 20, y);
            y += 8;
            doc.setFontSize(12);
            recipe.instructions.forEach((inst, index) => {
                const text = `${index + 1}. ${inst}`;
                const lines = doc.splitTextToSize(text, 170);
                doc.text(lines, 20, y);
                y += (lines.length * 7);
                if (y > 280) { doc.addPage(); y = 20; }
            });

            doc.save(`${recipe.title.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Error loading or generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    // This function now correctly wraps onLogMeal
    const handleLogMealSubmit = async (selectedDate, mealType) => {
        if (onLogMeal) {
            console.log("Adding to plan:", { recipe, selectedDate, mealType });
            await onLogMeal(recipe, selectedDate, mealType);
            console.log(`Recipe added to your meal plan for ${selectedDate}`);
            setShowAddToPlan(false); // Close the sub-modal
        } else {
            console.error("onLogMeal function is not defined");
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{recipe.title}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"><X size={24} /></button>
                    </header>
                    
                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column (Image & Info) */}
                        <div>
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-lg" />
                            <div className="flex justify-around items-center mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-center">
                                    <Clock className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.totalTime} min</p>
                                </div>
                                <div className="text-center">
                                    <Users className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.servings} servings</p>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-green-600">{recipe.totalCalories}</span>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">kcal</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <p><span className="font-semibold dark:text-gray-200">Cuisine:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.cuisine}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Difficulty:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.difficulty}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Diet:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.dietaryType}</span></p>
                            </div>
                        </div>

                        {/* Right Column (Ingredients & Instructions) */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Ingredients</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                                    {recipe.ingredients.map((ing, i) => (
                                        <li key={i}>{typeof ing === 'object' ? ing.original : ing}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Instructions</h3>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                                    {recipe.instructions.map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="p-4 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                        >
                            <Download size={18} />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={() => setShowAddToPlan(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            <Plus size={18} />
                            Add to Meal Plan
                        </button>
                    </footer>
                </div>
            </div>

            {/* Render the internal AddToPlanModal when showAddToPlan is true */}
            {showAddToPlan && (
                <AddToPlanModal
                    onClose={() => setShowAddToPlan(false)}
                    onLogMealSubmit={handleLogMealSubmit} // <-- This now passes the correct wrapped function
                />
            )}
        </>
    );
};
// --- (END OF UPDATED MODAL CODE) ---



// --- (Main Component: RecipeGenerator) ---
const RecipeGenerator = ({ allRecipes, userData, onSaveRecipe, onLogMeal }) => {
    const [masterIngredientList, setMasterIngredientList] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    
    const [foundRecipes, setFoundRecipes] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    
    const [filters, setFilters] = useState({ cuisine: '', difficulty: '', dietaryType: '' });
    const [displayRecipes, setDisplayRecipes] = useState([]);

    const suggestionsRef = useRef(null);

    useEffect(() => {
        const allCleanIngredients = allRecipes.flatMap(recipe => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) {
                return [];
            }
            if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0] !== null) {
                return recipe.ingredients.map(ing => ing.cleanName?.toLowerCase().trim());
            } else {
                return recipe.ingredients.map(ing => cleanIngredient(ing));
            }
        });
        const uniqueIngredients = [...new Set(allCleanIngredients)].filter(Boolean);
        setMasterIngredientList(uniqueIngredients.sort());
    }, [allRecipes]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    useEffect(() => {
        let result = foundRecipes;
        if (filters.cuisine) result = result.filter(r => r.cuisine === filters.cuisine);
        if (filters.difficulty) result = result.filter(r => r.difficulty === filters.difficulty);
        if (filters.dietaryType) result = result.filter(r => r.dietaryType === filters.dietaryType);
        setDisplayRecipes(result);
    }, [filters, foundRecipes]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        if (value) {
            const filteredSuggestions = masterIngredientList.filter(
                ing => ing.includes(value.toLowerCase()) && !selectedIngredients.includes(ing)
            );
            setSuggestions(filteredSuggestions.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const addIngredient = (ingredient) => {
        if (!selectedIngredients.includes(ingredient)) {
            setSelectedIngredients([...selectedIngredients, ingredient]);
        }
        setInputValue(''); setSuggestions([]);
    };

    const removeIngredient = (ingredientToRemove) => {
        setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredientToRemove));
    };

    const handleSearch = () => {
        setHasSearched(true);
        clearFilters();
        if (selectedIngredients.length === 0) {
            setFoundRecipes([]); return;
        }

        const matchedRecipes = allRecipes.filter(recipe => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) {
                return false;
            }
            
            let recipeCleanNames = [];
            if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0] !== null) {
                recipeCleanNames = recipe.ingredients.map(ing => ing.cleanName?.toLowerCase().trim());
            } else {
                recipeCleanNames = recipe.ingredients.map(ing => cleanIngredient(ing));
            }
            
            return selectedIngredients.every(term => recipeCleanNames.includes(term));
        });
        setFoundRecipes(matchedRecipes);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ cuisine: '', difficulty: '', dietaryType: '' });
    };

    const cuisineOptions = [...new Set(foundRecipes.map(r => r.cuisine).filter(Boolean))];
    const difficultyOptions = [...new Set(foundRecipes.map(r => r.difficulty).filter(Boolean))];
    const dietaryOptions = [...new Set(foundRecipes.map(r => r.dietaryType).filter(Boolean))];

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Recipe Generator</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Add ingredients you have to find recipes you can make!</p>
            
            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <label htmlFor="ingredients-input" className="block text-lg font-semibold text-gray-700 dark:text-gray-200">Your Ingredients</label>
                
                <div className="mt-2 p-2 border dark:border-gray-600 rounded-lg flex flex-wrap gap-2 items-center">
                    {selectedIngredients.map(ing => (
                        <span key={ing} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2">
                            {ing}
                            <button onClick={() => removeIngredient(ing)} className="font-bold"><X size={14}/></button>
                        </span>
                    ))}
                    <div className="relative flex-grow" ref={suggestionsRef}>
                        <input
                            id="ingredients-input"
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Type an ingredient..."
                            className="p-1 outline-none w-full bg-transparent dark:text-gray-200"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg mt-2 z-10">
                                {suggestions.map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => addIngredient(suggestion)}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleSearch}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                    <Search /> Find Recipes
                </button>
            </div>

            <div className="mt-12">
                {hasSearched && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Suggested Recipes ({foundRecipes.length})</h2>
                        
                        {foundRecipes.length > 0 && (
                             <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                <Filter className="text-gray-500 dark:text-gray-400 hidden md:block" />
                                <select name="cuisine" value={filters.cuisine} onChange={handleFilterChange} className="w-full md:w-auto p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                    <option value="">All Cuisines</option>
                                    {cuisineOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange} className="w-full md:w-auto p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                    <option value="">All Difficulties</option>
                                    {difficultyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select name="dietaryType" value={filters.dietaryType} onChange={handleFilterChange} className="w-full md:w-auto p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                    <option value="">All Diets</option>
                                    {dietaryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <button onClick={clearFilters} className="w-full md:w-auto flex items-center justify-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 font-semibold transition">
                                    <XCircle size={20} />
                                    <span>Clear</span>
                                </button>
                            </div>
                        )}
                        
                        {displayRecipes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                                {displayRecipes.map(recipe => (
                                    <RecipeCard 
                                        key={recipe.id} 
                                        recipe={recipe} 
                                        onSelect={() => setSelectedRecipe(recipe)} 
                                        isSaved={userData.savedRecipes?.includes(recipe.id)}
                                        onSave={() => onSaveRecipe(recipe.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center mt-12">
                                <Frown className="mx-auto text-gray-400" size={64}/>
                                <h2 className="mt-4 text-2xl font-bold text-gray-700 dark:text-gray-200">No matching recipes found</h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Try using different ingredients or adjusting your filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* This now passes `onLogMeal` to the new, correct RecipeDetailModal,
              which handles the rest of the logic flow internally.
            */}
            {selectedRecipe && (
                <RecipeDetailModal 
                    recipe={selectedRecipe} 
                    onClose={() => setSelectedRecipe(null)} 
                    onLogMeal={onLogMeal} 
                />
            )}
        </div>
    );
};

export default RecipeGenerator;