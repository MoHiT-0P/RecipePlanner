import React from 'react';
import { Clock, Users, Star, Zap, Heart } from 'lucide-react';

const RecipeCard = ({ recipe, onSelect, isSaved, onSave }) => {
    return (
        <div 
            onClick={() => onSelect(recipe)}
            className="flex-shrink-0 w-72 snap-start group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer"
        >
            {/* Save Button (Heart) - Top Right Overlay */}
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

export default RecipeCard;