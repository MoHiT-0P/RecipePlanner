import React, { useState, useEffect, useRef } from 'react';
import { 
    Frown, 
    Search, 
    X, 
    Filter, 
    XCircle, 
    ChefHat, 
    Plus, 
    Clock, 
    Users, 
    Star, 
    Zap, 
    Heart, 
    Download, 
    Calendar, 
    Utensils
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// --- (1) Inline Helper Components (RecipeCard, Modal) for Stability ---

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
            onClose();
        } catch (err) {
            console.error("Error logging meal:", err);
            setError("Failed to add meal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Meal Plan</h3>
                    <button onClick={onClose}><X className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full pl-10 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-white" required min={today}/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Type</label>
                        <div className="relative">
                            <Utensils className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <select value={mealType} onChange={e => setMealType(e.target.value)} className="w-full pl-10 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-white">
                                <option>Breakfast</option>
                                <option>Lunch</option>
                                <option>Dinner</option>
                            </select>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
                        {loading ? 'Adding...' : 'Add Meal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const RecipeDetailModal = ({ recipe, onClose, onLogMeal }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showAddToPlan, setShowAddToPlan] = useState(false);

    const handleDownloadPdf = () => {
        setIsDownloading(true);
        // Robust Script Injection for jsPDF
        if (window.jspdf && window.jspdf.jsPDF) { generatePdf(window.jspdf.jsPDF); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generatePdf(window.jspdf.jsPDF);
        document.body.appendChild(script);
    };

    const generatePdf = (jsPDF) => {
        try {
            const doc = new jsPDF();
            let y = 20;
            doc.setFontSize(22); doc.text(recipe.title, 15, y); y += 10;
            doc.setFontSize(12);
            doc.text(`Time: ${recipe.totalTime}m | Servings: ${recipe.servings} | Calories: ${recipe.totalCalories}`, 15, y); y += 10;
            doc.line(15, y, 195, y); y += 10;
            doc.setFontSize(16); doc.text("Ingredients", 15, y); y += 10;
            doc.setFontSize(12);
            (recipe.ingredients || []).forEach(ing => {
                const text = typeof ing === 'object' ? ing.original : ing;
                doc.text(`• ${text}`, 15, y); y += 7;
            });
            y += 5; doc.text("Instructions", 15, y); y += 10;
            (recipe.instructions || []).forEach((inst, i) => {
                const lines = doc.splitTextToSize(`${i+1}. ${inst}`, 180);
                doc.text(lines, 15, y); y += (lines.length * 7);
            });
            doc.save(`${recipe.title}.pdf`);
        } catch (e) { console.error(e); } finally { setIsDownloading(false); }
    };

    const handleLogMealSubmit = async (date, type) => {
        if(onLogMeal) await onLogMeal(recipe, date, type);
        setShowAddToPlan(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="relative h-64 bg-gray-200">
                        <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.title} />
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"><X size={24}/></button>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6">
                            <h2 className="text-3xl font-bold text-white">{recipe.title}</h2>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
                                <div className="text-center"><Clock className="mx-auto text-green-500 mb-1" size={20}/><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{recipe.totalTime}m</span></div>
                                <div className="text-center"><Users className="mx-auto text-green-500 mb-1" size={20}/><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{recipe.servings} ppl</span></div>
                                <div className="text-center"><Zap className="mx-auto text-green-500 mb-1" size={20}/><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{recipe.totalCalories} kcal</span></div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Ingredients</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                {(recipe.ingredients || []).map((ing, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                        <span>{typeof ing === 'object' ? ing.original : ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Instructions</h3>
                            <ol className="space-y-4 text-gray-600 dark:text-gray-300">
                                {(recipe.instructions || []).map((inst, i) => (
                                    <li key={i} className="flex gap-4">
                                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold text-xs">{i+1}</span>
                                        <p>{inst}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                    <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                        <button onClick={handleDownloadPdf} disabled={isDownloading} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <Download size={18}/> {isDownloading ? 'Saving...' : 'PDF'}
                        </button>
                        <button onClick={() => setShowAddToPlan(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                            <Plus size={18}/> Add to Plan
                        </button>
                    </div>
                </div>
            </div>
            {showAddToPlan && <AddToPlanModal onClose={() => setShowAddToPlan(false)} onLogMealSubmit={handleLogMealSubmit}/>}
        </>
    );
};

const RecipeCard = ({ recipe, onSelect, isSaved, onSave }) => (
    <div onClick={() => onSelect(recipe)} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer">
        <button onClick={(e) => { e.stopPropagation(); onSave(recipe.id); }} className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform group-hover:opacity-100">
            <Heart size={18} className={`transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
        </button>
        <div className="relative h-48 w-full overflow-hidden">
            <img src={recipe.imageUrl || 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm ${
                (recipe.difficulty || 'easy').toLowerCase() === 'easy' ? 'bg-green-500/90' : (recipe.difficulty || '').toLowerCase() === 'medium' ? 'bg-yellow-500/90' : 'bg-red-500/90'
            }`}>{recipe.difficulty || 'Easy'}</div>
        </div>
        <div className="p-4">
            <h4 className="text-base font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-green-600 transition-colors">{recipe.title}</h4>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><Clock size={12} /> {recipe.totalTime || 30}m</span>
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><Users size={12} /> {recipe.servings || 2}</span>
                    <span className="flex items-center gap-1 text-yellow-500 font-medium"><Star size={12} fill="currentColor" /> 4.8</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Zap size={12} className="text-orange-500" /> {recipe.totalCalories || 0} kcal</span>
                {recipe.dietaryType && recipe.dietaryType !== 'None' && <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full ml-auto">{recipe.dietaryType}</span>}
            </div>
        </div>
    </div>
);

// --- (2) Main Page Component ---

const cleanIngredient = (ingredient) => {
    if (typeof ingredient !== 'string') return '';
    return ingredient.toLowerCase().trim();
};

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

    // Initialize Autocomplete List
    useEffect(() => {
        const allCleanIngredients = allRecipes.flatMap(recipe => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) return [];
            if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0] !== null) {
                return recipe.ingredients.map(ing => ing.cleanName?.toLowerCase().trim()).filter(Boolean);
            } else {
                return recipe.ingredients.map(ing => cleanIngredient(ing)).filter(Boolean);
            }
        });
        const uniqueIngredients = [...new Set(allCleanIngredients)];
        setMasterIngredientList(uniqueIngredients.sort());
    }, [allRecipes]);

    // Handle Click Outside for Suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    // Filtering Logic
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
        setFilters({ cuisine: '', difficulty: '', dietaryType: '' });
        
        const query = inputValue.trim().toLowerCase();

        // 1. If no ingredients AND no text input, show nothing
        if (selectedIngredients.length === 0 && !query) {
            setFoundRecipes([]); return;
        }

        const matchedRecipes = allRecipes.filter(recipe => {
            // Check 1: Ingredient Chips (Recipe must have ALL selected chips)
            let matchesChips = true;
            if (selectedIngredients.length > 0) {
                 if (!recipe.ingredients || recipe.ingredients.length === 0) return false;
                
                let recipeCleanNames = [];
                if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0] !== null) {
                    recipeCleanNames = recipe.ingredients.map(ing => ing.cleanName?.toLowerCase().trim());
                } else {
                    recipeCleanNames = recipe.ingredients.map(ing => cleanIngredient(ing));
                }
                
                matchesChips = selectedIngredients.every(term => recipeCleanNames.includes(term));
            }

            // Check 2: Text Search (Title OR Ingredients must match query)
            let matchesQuery = true;
            if (query) {
                const titleMatch = recipe.title.toLowerCase().includes(query);
                const ingredientMatch = recipe.ingredients && recipe.ingredients.some(ing => {
                    const str = typeof ing === 'object' ? (ing.cleanName || ing.name || ing.original) : ing;
                    return String(str).toLowerCase().includes(query);
                });
                matchesQuery = titleMatch || ingredientMatch;
            }
            
            return matchesChips && matchesQuery;
        });
        setFoundRecipes(matchedRecipes);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => setFilters({ cuisine: '', difficulty: '', dietaryType: '' });

    const cuisineOptions = [...new Set(foundRecipes.map(r => r.cuisine).filter(Boolean))];
    const difficultyOptions = [...new Set(foundRecipes.map(r => r.difficulty).filter(Boolean))];
    const dietaryOptions = [...new Set(foundRecipes.map(r => r.dietaryType).filter(Boolean))];

    return (
        <div className="pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-900 dark:to-emerald-900 rounded-3xl p-8 mb-10 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold mb-3">What's in your kitchen? 🥕</h1>
                    <p className="text-green-100 text-lg opacity-90 max-w-2xl">
                        Enter the ingredients you have, or search for any recipe you crave. No more food waste!
                    </p>
                </div>
                <ChefHat className="absolute right-10 top-1/2 -translate-y-1/2 text-white opacity-10 w-48 h-48" />
            </div>
            
            {/* Ingredient Input Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-12">
                <label className="block text-lg font-bold text-gray-800 dark:text-white mb-4">Your Ingredients & Search</label>
                
                <div className="flex flex-wrap gap-2 items-center p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
                    {selectedIngredients.map(ing => (
                        <span key={ing} className="bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center gap-2 text-sm font-medium animate-fade-in">
                            {ing}
                            <button onClick={() => removeIngredient(ing)} className="hover:text-red-500 transition-colors"><X size={14}/></button>
                        </span>
                    ))}
                    <div className="relative flex-grow" ref={suggestionsRef}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                    setSuggestions([]); 
                                }
                            }}
                            placeholder={selectedIngredients.length === 0 ? "Type an ingredient, recipe name, or keyword..." : "Add another ingredient or press Enter..."}
                            className="w-full bg-transparent outline-none p-2 text-gray-700 dark:text-gray-200 placeholder-gray-400"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl mt-2 z-20 max-h-60 overflow-y-auto">
                                {suggestions.map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => addIngredient(suggestion)}
                                        className="block w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200 transition-colors"
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
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                    <Search size={22} /> Find Recipes
                </button>
            </div>

            {/* Results Section */}
            {hasSearched && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Found {foundRecipes.length} Recipe{foundRecipes.length !== 1 && 's'}
                        </h2>
                        {/* Filters Toolbar */}
                        {foundRecipes.length > 0 && (
                             <div className="flex gap-3 mt-4 md:mt-0 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
                                <select name="cuisine" value={filters.cuisine} onChange={handleFilterChange} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white">
                                    <option value="">All Cuisines</option>
                                    {cuisineOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white">
                                    <option value="">All Difficulties</option>
                                    {difficultyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <button onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap">
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {displayRecipes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Frown className="text-gray-400" size={40}/>
                            </div>
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">No matching recipes found</h2>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Try removing some ingredients or adjusting your filters.</p>
                        </div>
                    )}
                </div>
            )}
            
            {selectedRecipe && (
                <RecipeDetailModal 
                    user={userData} 
                    recipe={selectedRecipe} 
                    onClose={() => setSelectedRecipe(null)} 
                    onLogMeal={onLogMeal} 
                />
            )}
        </div>
    );
};

export default RecipeGenerator;