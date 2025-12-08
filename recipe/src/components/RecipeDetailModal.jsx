import React, { useState } from 'react';
import { X, Clock, Users, Calendar, Utensils, Download, Plus } from 'lucide-react';

// --- AddToPlanModal (Internal Component) ---
// This component now has the full UI (date + meal type dropdown)
// It calls the 'onLogMealSubmit' function passed to it.
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
            // Call the function passed down from the parent (RecipeDetailModal)
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
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


// --- Main RecipeDetailModal Component ---
// It now receives 'onLogMeal' from App.jsx and passes it to the internal modal
const RecipeDetailModal = ({ recipe, onClose, onLogMeal }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    // This state controls the *internal* "Add to Plan" modal
    const [showAddToPlan, setShowAddToPlan] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            // Dynamically import jsPDF from a CDN
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
                // Handle both string and object ingredients
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

    // This function is passed to the internal AddToPlanModal
    // It calls the main 'onLogMeal' function (from App.jsx) and closes the sub-modal
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
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-40" onClick={onClose}>
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
                            onClick={() => setShowAddToPlan(true)} // <-- This opens the *internal* modal
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
                    onLogMealSubmit={handleLogMealSubmit}
                />
            )}
        </>
    );
};

export default RecipeDetailModal;