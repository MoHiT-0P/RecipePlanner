import React, { useState } from 'react';
import RecipeCard from '../components/RecipeCard';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { Frown } from 'lucide-react';

const SavedRecipes = ({ user, userData, recipes, onSaveRecipe, onLogMeal }) => { // Added user prop
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const savedRecipeDetails = recipes.filter(recipe => userData.savedRecipes?.includes(recipe.id));

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">My Saved Recipes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your collection of favorite meals.</p>

            {savedRecipeDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {savedRecipeDetails.map(recipe => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            onSelect={() => setSelectedRecipe(recipe)} 
                            isSaved={true}
                            onSave={() => onSaveRecipe(recipe.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center mt-16">
                    <Frown className="mx-auto text-gray-400" size={64}/>
                    <h2 className="mt-4 text-2xl font-bold text-gray-700 dark:text-gray-200">No recipes saved yet!</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Click the heart icon on any recipe to add it to this list.</p>
                </div>
            )}

            {/* UPDATED: Pass the user prop down to the modal */}
            {selectedRecipe && <RecipeDetailModal user={user} recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onLogMeal={onLogMeal} />}
        </div>
    );
};

export default SavedRecipes;

