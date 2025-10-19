import React, { useState } from 'react';
import { db } from '../firebase.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { X, Calendar, Utensils } from 'lucide-react';

const AddToPlanModal = ({ user, recipe, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [mealType, setMealType] = useState('Breakfast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Corrected Date Handling:
            // Create a date object from the YYYY-MM-DD string.
            // This ensures it's interpreted as the start of the day in the user's local timezone,
            // which Firestore then correctly converts to a consistent UTC timestamp.
            const planDate = new Date(selectedDate + 'T00:00:00');

            const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
            await addDoc(mealPlanRef, {
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                date: Timestamp.fromDate(planDate),
                mealType: mealType,
                calories: recipe.totalCalories,
                createdAt: Timestamp.now(),
            });
            onClose(); // Close modal on success
        } catch (err) {
            // Log the detailed error to the console for debugging
            console.error("Detailed error adding to meal plan: ", err);
            setError("Failed to add meal. Please check the console for details.");
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
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{recipe.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{recipe.totalCalories} kcal</p>
                    </div>
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

export default AddToPlanModal;

