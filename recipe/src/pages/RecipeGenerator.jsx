import React, { useState, useEffect, useRef } from 'react';
import RecipeCard from '../components/RecipeCard';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { Frown, Search, X, Filter, XCircle } from 'lucide-react';

// Helper function to clean ingredient strings
const cleanIngredient = (text) => {
    return text
        .toLowerCase()
        .replace(/([\d/]+|cup|cups|tsp|tbsp|g|kg|oz|ml|l|diced|chopped|minced|sliced|whole|peeled|grated|can)/g, '')
        .replace(/[,-]/g, ' ')
        .trim()
        .split(' ')[0];
};

const RecipeGenerator = ({ user, allRecipes, userData, onSaveRecipe, onLogMeal }) => { // Added user prop
    const [masterIngredientList, setMasterIngredientList] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    
    const [foundRecipes, setFoundRecipes] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    
    const [filters, setFilters] = useState({
        cuisine: '',
        difficulty: '',
        dietaryType: '',
    });
    const [displayRecipes, setDisplayRecipes] = useState([]);

    const suggestionsRef = useRef(null);

    useEffect(() => {
        const allIngredients = allRecipes.flatMap(recipe => recipe.ingredients.map(cleanIngredient));
        const uniqueIngredients = [...new Set(allIngredients)].filter(Boolean);
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
        if (filters.cuisine) {
            result = result.filter(recipe => recipe.cuisine === filters.cuisine);
        }
        if (filters.difficulty) {
            result = result.filter(recipe => recipe.difficulty === filters.difficulty);
        }
        if (filters.dietaryType) {
            result = result.filter(recipe => recipe.dietaryType === filters.dietaryType);
        }
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
        setInputValue('');
        setSuggestions([]);
    };

    const removeIngredient = (ingredientToRemove) => {
        setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredientToRemove));
    };

    const handleSearch = () => {
        setHasSearched(true);
        clearFilters();
        if (selectedIngredients.length === 0) {
            setFoundRecipes([]);
            return;
        }
        const matchedRecipes = allRecipes.filter(recipe => {
            const cleanedRecipeIngredients = recipe.ingredients.map(cleanIngredient);
            return selectedIngredients.every(term => cleanedRecipeIngredients.includes(term));
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
            {/* UPDATED: Pass the user prop down to the modal */}
            {selectedRecipe && <RecipeDetailModal user={user} recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onLogMeal={onLogMeal} />}
        </div>
    );
};

export default RecipeGenerator;

