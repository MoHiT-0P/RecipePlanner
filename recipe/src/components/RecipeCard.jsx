import React from 'react';
import { Heart } from 'lucide-react';

const RecipeCard = ({ recipe, onSelect, isSaved, onSave }) => (
  <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm overflow-hidden flex flex-col group">
    <div className="relative">
      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover" />
      <div className="absolute top-3 right-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onSave(); }} 
          className={`p-2 rounded-full transition-colors duration-200 ${isSaved ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900'}`}
        >
          <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition">{recipe.title}</h3>
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2 gap-4">
        <span>{recipe.cookTime} min</span>
        <span>&bull;</span>
        <span>{recipe.totalCalories} Cals</span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex-grow flex items-end">
         <div className="flex flex-wrap gap-2">
            {recipe.tags && recipe.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">{tag}</span>
            ))}
        </div>
      </div>
    </div>
    <button onClick={onSelect} className="w-full text-center bg-gray-50 dark:bg-gray-700/50 p-3 font-semibold text-gray-700 dark:text-gray-200 hover:bg-green-500 hover:text-white dark:hover:bg-green-600 transition">
        View Recipe
    </button>
  </div>
);

export default RecipeCard;

