import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import RecipeCard from '../components/RecipeCard';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { Utensils, Star, Heart, Clock, Filter, XCircle } from 'lucide-react';

const Dashboard = ({ user, userData, recipes, onSaveRecipe, onLogMeal }) => { // Added user prop
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    
    const [filters, setFilters] = useState({
        cuisine: '',
        difficulty: '',
        dietaryType: '',
    });
    const [filteredRecipes, setFilteredRecipes] = useState(recipes);

    useEffect(() => {
        let result = recipes;
        if (filters.cuisine) {
            result = result.filter(recipe => recipe.cuisine === filters.cuisine);
        }
        if (filters.difficulty) {
            result = result.filter(recipe => recipe.difficulty === filters.difficulty);
        }
        if (filters.dietaryType) {
            result = result.filter(recipe => recipe.dietaryType === filters.dietaryType);
        }
        setFilteredRecipes(result);
    }, [filters, recipes]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ cuisine: '', difficulty: '', dietaryType: '' });
    };

    const quickRecipes = recipes.filter(r => r.cookTime <= 30).slice(0, 4);
    const healthyRecipes = recipes.filter(r => r.totalCalories <= 600).slice(0, 4);

    const cuisineOptions = [...new Set(recipes.map(r => r.cuisine).filter(Boolean))];
    const difficultyOptions = [...new Set(recipes.map(r => r.difficulty).filter(Boolean))];
    const dietaryOptions = [...new Set(recipes.map(r => r.dietaryType).filter(Boolean))];

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Good morning, Chef! 🧑‍🍳</h1>
            <p className="text-gray-500 mt-2 dark:text-gray-400">Ready to discover your next favorite recipe?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard icon={<Utensils />} label="Recipes Cooked" value={userData.recipesCooked} />
                <StatCard icon={<Star />} label="Week Streak" value={userData.weekStreak} />
                <StatCard icon={<Heart />} label="Saved Recipes" value={userData.savedRecipes?.length || 0} />
                <StatCard icon={<Clock />} label="Calories Today" value={userData.caloriesToday} />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mt-12 dark:text-gray-100">Quick & Easy ⚡</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {quickRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => setSelectedRecipe(recipe)} isSaved={userData.savedRecipes?.includes(recipe.id)} onSave={() => onSaveRecipe(recipe.id)} />
                ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mt-12 dark:text-gray-100">Healthy Choices 🥗</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {healthyRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => setSelectedRecipe(recipe)} isSaved={userData.savedRecipes?.includes(recipe.id)} onSave={() => onSaveRecipe(recipe.id)} />
                ))}
            </div>
            
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Browse All Recipes</h2>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {filteredRecipes.map(recipe => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onSelect={() => setSelectedRecipe(recipe)} 
                        isSaved={userData.savedRecipes?.includes(recipe.id)}
                        onSave={() => onSaveRecipe(recipe.id)}
                    />
                ))}
            </div>

            {/* UPDATED: Pass the user prop down to the modal */}
            {selectedRecipe && <RecipeDetailModal user={user} recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onLogMeal={onLogMeal} />}
        </div>
    );
};

export default Dashboard;

