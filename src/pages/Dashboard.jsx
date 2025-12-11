import React, { useState, useEffect, useRef } from 'react';
import { 
    Flame, 
    Utensils, 
    ChefHat, 
    ArrowRight, 
    Search,
    Clock,
    Zap,
    X,
    Play,
    Users,
    Calendar,
    Download,
    Plus,
    Star,
    Heart,
    ChevronLeft,
    ChevronRight,
    Leaf
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// --- Inline RecipeDetailModal Components (Kept inline to ensure stability) ---

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
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
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

    // --- PDF GENERATION LOGIC (Script Injection Method) ---
    const generatePdf = (jsPDF) => {
        try {
            const doc = new jsPDF();
            const margin = 15;
            let y = 20;

            doc.setFontSize(22);
            doc.text(recipe.title, margin, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.text(`Cuisine: ${recipe.cuisine || 'N/A'}`, margin, y); y += 7;
            doc.text(`Difficulty: ${recipe.difficulty || 'N/A'}`, margin, y); y += 7;
            doc.text(`Total Time: ${recipe.totalTime || recipe.cookTime || 'N/A'} mins`, margin, y); y += 7;
            doc.text(`Servings: ${recipe.servings || 'N/A'}`, margin, y); y += 7;
            doc.text(`Calories: ${recipe.totalCalories || 'N/A'} kcal`, margin, y); y += 10;

            doc.setLineWidth(0.5);
            doc.line(margin, y, 195, y);
            y += 10;

            doc.setFontSize(16);
            doc.text("Ingredients:", margin, y);
            y += 8;
            doc.setFontSize(12);
            
            const ingredients = recipe.ingredients || [];
            ingredients.forEach(ing => {
                const text = typeof ing === 'object' ? ing.original : ing;
                const lines = doc.splitTextToSize(`• ${text}`, 180);
                
                if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
                doc.text(lines, margin, y);
                y += lines.length * 7;
            });

            y += 5;
            doc.setLineWidth(0.5);
            doc.line(margin, y, 195, y);
            y += 10;

            doc.setFontSize(16);
            doc.text("Instructions:", margin, y);
            y += 8;
            doc.setFontSize(12);
            
            const instructions = recipe.instructions || [];
            instructions.forEach((inst, index) => {
                const text = `${index + 1}. ${inst}`;
                const lines = doc.splitTextToSize(text, 180);
                
                if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
                doc.text(lines, margin, y);
                y += lines.length * 7 + 3;
            });

            doc.save(`${recipe.title.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPdf = () => {
        setIsDownloading(true);
        
        if (window.jspdf && window.jspdf.jsPDF) {
            generatePdf(window.jspdf.jsPDF);
            return;
        }
        
        if (window.jsPDF) {
             generatePdf(window.jsPDF);
             return;
        }

        const scriptId = 'jspdf-script';
        if (document.getElementById(scriptId)) {
             const script = document.getElementById(scriptId);
             script.addEventListener('load', () => {
                 if (window.jspdf && window.jspdf.jsPDF) generatePdf(window.jspdf.jsPDF);
                 else if (window.jsPDF) generatePdf(window.jsPDF);
             });
             return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) {
                generatePdf(window.jspdf.jsPDF);
            } else {
                console.error("jsPDF not found on window after script load");
                setIsDownloading(false);
            }
        };
        script.onerror = () => {
            console.error("Failed to load jsPDF script");
            setIsDownloading(false);
            alert("Could not load PDF generator.");
        };
        document.body.appendChild(script);
    };

    const handleLogMealSubmit = async (selectedDate, mealType) => {
        if (onLogMeal) {
            await onLogMeal(recipe, selectedDate, mealType);
            setShowAddToPlan(false);
        } else {
            console.error("onLogMeal function is not defined");
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{recipe.title}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"><X size={24} /></button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'; }} />
                            <div className="flex justify-around items-center mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-center">
                                    <Clock className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.totalTime || recipe.cookTime || 'N/A'} min</p>
                                </div>
                                <div className="text-center">
                                    <Users className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.servings || 'N/A'} servings</p>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-green-600">{recipe.totalCalories || 'N/A'}</span>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">kcal</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <p><span className="font-semibold dark:text-gray-200">Cuisine:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.cuisine}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Difficulty:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.difficulty}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Diet:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.dietaryType}</span></p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Ingredients</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                                    {(recipe.ingredients || []).map((ing, i) => (
                                        <li key={i}>{typeof ing === 'object' ? ing.original : ing}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Instructions</h3>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                                    {(recipe.instructions || []).map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>

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

            {showAddToPlan && (
                <AddToPlanModal
                    onClose={() => setShowAddToPlan(false)}
                    onLogMealSubmit={handleLogMealSubmit}
                />
            )}
        </>
    );
};

// --- Dashboard Components ---

const CategoryPill = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
            active 
            ? 'bg-green-600 border-green-600 text-white shadow-md' 
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:text-green-600'
        }`}
    >
        {label}
    </button>
);

const RecipeCard = ({ recipe, onSelect, isSaved, onSave }) => {
    return (
        <div 
            onClick={() => onSelect(recipe)}
            className="flex-shrink-0 w-72 snap-start group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer"
        >
            {/* Save Button (Heart) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSave(recipe.id);
                }}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform group-hover:opacity-100"
            >
                <Heart 
                    size={18} 
                    className={`transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
                />
            </button>

            {/* Image Section */}
            <div className="relative h-44 w-full overflow-hidden">
                <img 
                    src={recipe.imageUrl || 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'; }}
                />
                {/* Difficulty Badge */}
                <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm ${
                    (recipe.difficulty || 'easy').toLowerCase() === 'easy' ? 'bg-green-500/90' : 
                    (recipe.difficulty || '').toLowerCase() === 'medium' ? 'bg-yellow-500/90' : 
                    'bg-red-500/90'
                }`}>
                    {recipe.difficulty || 'Easy'}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-green-600 transition-colors">
                    {recipe.title}
                </h4>
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            <Clock size={12} /> {recipe.totalTime || recipe.cookTime || 'N/A'} min
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            <Users size={12} /> {recipe.servings || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500 font-medium">
                            <Star size={12} fill="currentColor" /> 4.5
                        </span>
                    </div>
                </div>

                {/* Diet/Calorie Tags */}
                <div className="flex items-center gap-2 mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Zap size={12} className="text-orange-500" /> {recipe.totalCalories || 0} kcal
                    </span>
                    {recipe.dietaryType && recipe.dietaryType !== 'None' && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full ml-auto">
                            {recipe.dietaryType}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Recipe Row with Netflix-style Arrows
const RecipeRow = ({ title, icon: Icon, recipes, onSelect, onSave, savedRecipeIds }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!recipes || recipes.length === 0) return null;

    return (
        <div className="mb-12 relative group/row">
            <div className="flex justify-between items-end mb-4 px-1">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={24} className="text-gray-800 dark:text-gray-200" />}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {title}
                    </h3>
                </div>
                {/* <button className="text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight size={14} />
                </button> */}
            </div>
            
            {/* Scroll Buttons */}
            <button 
                onClick={() => scroll('left')}
                className="absolute -left-4 top-[60%] -translate-y-1/2 z-20 bg-white dark:bg-black/60 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover/row:opacity-100 transition-all hover:scale-110 disabled:opacity-0 hidden md:block"
            >
                <ChevronLeft size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="absolute -right-4 top-[60%] -translate-y-1/2 z-20 bg-white dark:bg-black/60 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover/row:opacity-100 transition-all hover:scale-110 disabled:opacity-0 hidden md:block"
            >
                <ChevronRight size={20} className="text-gray-700 dark:text-gray-200" />
            </button>

            {/* Horizontal Scroll Container */}
            <div 
                ref={rowRef}
                className="flex overflow-x-hidden gap-5 snap-x snap-mandatory py-2 px-1 scroll-smooth"
            >
                {recipes.map((recipe) => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onSelect={onSelect} 
                        isSaved={savedRecipeIds?.includes(recipe.id)}
                        onSave={onSave}
                    />
                ))}
            </div>
        </div>
    );
};

const Dashboard = ({ user, userData, recipes = [], onLogMeal, onNavigate, onSaveRecipe, db }) => {
    const [greeting, setGreeting] = useState('Hello');
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [loadingMeals, setLoadingMeals] = useState(true);
    
    // Search & Filter State
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); 
    const searchInputRef = useRef(null);

    // Categories
    const [quickRecipes, setQuickRecipes] = useState([]);
    const [healthyRecipes, setHealthyRecipes] = useState([]);
    const [vegRecipes, setVegRecipes] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);

    // 1. Time-based Greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // 2. Fetch Stats
    useEffect(() => {
        const fetchTodaysMeals = async () => {
            if (!user) return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const q = query(
                collection(db, `users/${user.uid}/mealPlan`),
                where("date", ">=", Timestamp.fromDate(today)),
                where("date", "<", Timestamp.fromDate(tomorrow))
            );

            try {
                const snapshot = await getDocs(q);
                const meals = snapshot.docs.map(doc => doc.data());
                setTodaysMeals(meals);
            } catch (error) {
                console.error("Error fetching today's meals:", error);
            } finally {
                setLoadingMeals(false);
            }
        };
        fetchTodaysMeals();
    }, [user]);

    // 3. Organize Recipes (UPDATED: Check tags/arrays & STRICT Vegetarian)
    useEffect(() => {
        if (recipes && recipes.length > 0) {
            setQuickRecipes(recipes.filter(r => (parseInt(r.totalTime) || parseInt(r.cookTime) || 999) <= 30));
            setHealthyRecipes(recipes.filter(r => (parseInt(r.totalCalories) || 9999) <= 500));
            
            // STRICT Vegetarian Filter
            setVegRecipes(recipes.filter(r => {
                const dietString = r.dietaryType?.toLowerCase() || '';
                const dishTypes = Array.isArray(r.dishTypes) ? r.dishTypes : [];
                const diets = Array.isArray(r.diets) ? r.diets : [];
                const tags = Array.isArray(r.tags) ? r.tags : [];
                const allTags = [dietString, ...dishTypes, ...diets, ...tags].join(' ').toLowerCase();

                // Must include 'veg' or 'vegan' AND NOT include 'non'
                return (allTags.includes('veg') || allTags.includes('vegan')) && !allTags.includes('non');
            }));
        }
    }, [recipes]);

    // 4. Search & Filter Logic (UPDATED: Check tags/arrays & STRICT Vegetarian)
    useEffect(() => {
        if (!searchTerm && activeFilter === 'All') {
            setFilteredResults([]); 
            return;
        }

        let results = recipes || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(r => r.title.toLowerCase().includes(term));
        }

        if (activeFilter !== 'All') {
            if (activeFilter === 'Quick') {
                results = results.filter(r => (parseInt(r.totalTime) || parseInt(r.cookTime) || 999) <= 30);
            } else if (activeFilter === 'Healthy') {
                results = results.filter(r => (parseInt(r.totalCalories) || 9999) <= 500);
            } else if (activeFilter === 'Vegetarian') {
                // STRICT Vegetarian Filter for Search Results
                results = results.filter(r => {
                    const dietString = r.dietaryType?.toLowerCase() || '';
                    const dishTypes = Array.isArray(r.dishTypes) ? r.dishTypes : [];
                    const diets = Array.isArray(r.diets) ? r.diets : [];
                    const tags = Array.isArray(r.tags) ? r.tags : [];
                    const allTags = [dietString, ...dishTypes, ...diets, ...tags].join(' ').toLowerCase();
                    return (allTags.includes('veg') || allTags.includes('vegan')) && !allTags.includes('non');
                });
            } else if (activeFilter === 'Breakfast') {
                results = results.filter(r => {
                    const dishTypes = Array.isArray(r.dishTypes) ? r.dishTypes : [];
                    const tags = Array.isArray(r.tags) ? r.tags : [];
                    const dishTypeString = r.dishType?.toLowerCase() || '';
                    const title = r.title.toLowerCase();
                    const allTags = [...dishTypes, ...tags, dishTypeString].join(' ').toLowerCase();
                    return (
                        allTags.includes('breakfast') || 
                        allTags.includes('morning meal') ||
                        title.includes('pancake') ||
                        title.includes('egg') ||
                        title.includes('omelet') ||
                        title.includes('breakfast')
                    );
                });
            }
        }

        setFilteredResults(results);
    }, [searchTerm, activeFilter, recipes]);

    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    const dailyCalories = todaysMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);

    const stats = [
        { label: 'Recipes Cooked', value: userData?.recipesCooked || 0, icon: ChefHat, color: 'text-green-600', bg: 'bg-white' },
        { label: 'Week Streak', value: userData?.weekStreak || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-white' },
        { label: 'Saved Recipes', value: userData?.savedRecipes?.length || 0, icon: Heart, color: 'text-red-500', bg: 'bg-white' },
        { label: 'Calories Today', value: dailyCalories, icon: Zap, color: 'text-blue-500', bg: 'bg-white' },
    ];

    const [selectedRecipe, setSelectedRecipe] = useState(null);

    return (
        <div className="pb-20 space-y-10">
            {/* Top Section */}
            <div className="flex flex-col xl:flex-row gap-8 items-start justify-between">
                <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl w-full xl:w-1/2 relative overflow-hidden border border-blue-100 dark:border-gray-700">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {greeting}, {userData?.email?.split('@')[0] || 'Chef'}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Ready to discover your next favorite recipe?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => onNavigate('recipeGenerator')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-colors"
                            >
                                <ChefHat size={18} /> Generate Recipe
                            </button>
                            <button 
                                onClick={() => onNavigate('mealPlanner')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <Calendar size={18} /> Plan Meals
                            </button>
                        </div>
                    </div>
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-3xl"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-1/2">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full transition-transform hover:-translate-y-1">
                            <div className={`mb-2 p-2 rounded-full ${stat.color.replace('text-', 'bg-').replace('500', '50').replace('600', '50')} dark:bg-gray-700`}>
                                <stat.icon size={20} className={stat.color} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className={`flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm transition-all duration-300 ease-in-out ${isSearchExpanded || searchTerm ? 'w-full md:w-96 px-4 py-2' : 'w-12 h-12 justify-center cursor-pointer hover:bg-gray-50'}`}>
                    {isSearchExpanded || searchTerm ? (
                        <>
                            <Search size={20} className="text-gray-400 flex-shrink-0 mr-3" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Search recipes..." 
                                className="bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onBlur={() => !searchTerm && setIsSearchExpanded(false)}
                            />
                            <button onClick={() => { setSearchTerm(''); setIsSearchExpanded(false); }} className="ml-2 text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsSearchExpanded(true)} className="text-gray-500 dark:text-gray-400">
                            <Search size={22} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto pb-1">
                    {['All', 'Breakfast', 'Healthy', 'Quick', 'Vegetarian'].map(filter => (
                        <CategoryPill 
                            key={filter} 
                            label={filter} 
                            active={activeFilter === filter} 
                            onClick={() => setActiveFilter(filter)}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            {(searchTerm || activeFilter !== 'All') ? (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {filteredResults.length} Result{filteredResults.length !== 1 && 's'} found
                    </h2>
                    {filteredResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredResults.map(recipe => (
                                <RecipeCard 
                                    key={recipe.id} 
                                    recipe={recipe} 
                                    onSelect={setSelectedRecipe} 
                                    isSaved={userData.savedRecipes?.includes(recipe.id)}
                                    onSave={onSaveRecipe}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No recipes match your criteria.</p>
                            <button onClick={() => {setSearchTerm(''); setActiveFilter('All')}} className="text-green-600 font-medium mt-2 hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <RecipeRow 
                        title="Featured Recipes ✨" 
                        recipes={recipes ? recipes.slice(0, 6) : []} 
                        onSelect={setSelectedRecipe} 
                        onSave={onSaveRecipe}
                        savedRecipeIds={userData.savedRecipes}
                    />

                    <RecipeRow 
                        title="Healthy Choices (< 500 kcal)" 
                        icon={Utensils} 
                        recipes={healthyRecipes} 
                        onSelect={setSelectedRecipe} 
                        onSave={onSaveRecipe}
                        savedRecipeIds={userData.savedRecipes}
                    />

                    <RecipeRow 
                        title="Quick & Easy ⚡" 
                        icon={Zap} 
                        recipes={quickRecipes} 
                        onSelect={setSelectedRecipe} 
                        onSave={onSaveRecipe}
                        savedRecipeIds={userData.savedRecipes}
                    />

                    <RecipeRow 
                        title="Vegetarian Favorites 🥗" 
                        icon={Leaf} 
                        recipes={vegRecipes} 
                        onSelect={setSelectedRecipe} 
                        onSave={onSaveRecipe}
                        savedRecipeIds={userData.savedRecipes}
                    />
                </div>
            )}

            {/* Recipe Detail Modal */}
            {selectedRecipe && (
                <RecipeDetailModal 
                    recipe={selectedRecipe} 
                    user={user} 
                    onClose={() => setSelectedRecipe(null)} 
                    onLogMeal={onLogMeal}
                />
            )}
        </div>
    );
};

export default Dashboard;