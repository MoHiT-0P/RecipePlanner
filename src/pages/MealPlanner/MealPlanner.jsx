import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.js'; // Assuming 'src/pages/MealPlanner' -> 'src/firebase'
import { collection, onSnapshot, query, where, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, PlusCircle, X, AlertTriangle } from 'lucide-react';

// --- Helper function to get a YYYY-MM-DD string from a Date object ---
const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Main Meal Planner Component
const MealPlanner = ({ 
    user, 
    recipes, 
    generationError, 
    isGeneratingPlan, 
    onGeneratePlan
}) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const [weekDates, setWeekDates] = useState([]);
    const [mealPlan, setMealPlan] = useState({});
    
    // --- NEW STATE FOR THE CHECKBOX ---
    const [useAllRecipes, setUseAllRecipes] = useState(false);

    // Effect to update the week dates when the offset changes
    useEffect(() => {
        const getWeekDates = () => {
            const today = new Date();
            today.setDate(today.getDate() + weekOffset * 7);
            const currentDay = today.getDay();
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
            const monday = new Date(today.setDate(today.getDate() + mondayOffset));
            
            const dates = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(monday);
                date.setDate(date.getDate() + i);
                dates.push(date);
            }
            setWeekDates(dates);
        };
        getWeekDates();
    }, [weekOffset]);

    // Effect to listen for real-time updates to the meal plan
    useEffect(() => {
        if (!user || weekDates.length === 0) return;

        const startOfWeek = new Date(weekDates[0]);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(weekDates[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
        const q = query(mealPlanRef, where("date", ">=", startOfWeek), where("date", "<=", endOfWeek));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const plan = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const localDate = data.date.toDate(); 
                const dateStr = toLocalDateString(localDate);
                
                if (!plan[dateStr]) {
                    plan[dateStr] = {};
                }
                
                // Ensure mealType exists before assigning
                if (data.mealType) {
                    plan[dateStr][data.mealType] = { id: doc.id, ...data };
                } else {
                    console.warn("Meal plan item missing mealType:", doc.id);
                }
            });
            setMealPlan(plan);
        });

        return () => unsubscribe();
    }, [user, weekDates]);

    if (weekDates.length === 0) {
        return <div>Loading calendar...</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Meal Planner</h1>
            <WeekNavigator 
                startDate={weekDates[0]} 
                endDate={weekDates[6]} 
                onPrev={() => setWeekOffset(prev => prev - 1)} 
                onNext={() => setWeekOffset(prev => prev + 1)} 
                // --- Pass new props down ---
                onGenerate={onGeneratePlan}
                isGenerating={isGeneratingPlan}
                onSetWeekOffset={setWeekOffset}
                useAllRecipes={useAllRecipes}
                setUseAllRecipes={setUseAllRecipes}
            />

            {/* --- NEW ERROR DISPLAY --- */}
            {generationError && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{generationError}</span>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mt-6">
                {weekDates.map(date => (
                    <DayColumn 
                        key={date.toISOString()} 
                        date={date} 
                        plannedMeals={mealPlan[toLocalDateString(date)] || {}}
                        recipes={recipes}
                        user={user}
                    />
                ))}
            </div>
        </div>
    );
};

// --- Helper Components for the Planner ---

const WeekNavigator = ({ 
    startDate, 
    endDate, 
    onPrev, 
    onNext, 
    onGenerate,
    isGenerating,
    onSetWeekOffset,
    // --- NEW PROPS for the checkbox ---
    useAllRecipes,
    setUseAllRecipes
}) => {
    const options = { month: 'short', day: 'numeric' };

    // --- UPDATED: Pass the checkbox state to the AI function ---
    const handleGenerateClick = async () => {
        const success = await onGenerate(useAllRecipes); // Pass the state
        if (success) {
            onSetWeekOffset(0); // If successful, jump to the current week
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between mt-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm gap-4">
            
            {/* Week Navigation */}
            <div className="flex items-center">
                <button onClick={onPrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft /></button>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 text-center w-52">
                    {startDate.toLocaleDateString(undefined, options)} - {endDate.toLocaleDateString(undefined, { ...options, year: 'numeric' })}
                </div>
                <button onClick={onNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight /></button>
            </div>
            
            {/* AI Controls */}
            <div className="flex-grow flex flex-col sm:flex-row items-center justify-end gap-3">
                {/* --- NEW CHECKBOX --- */}
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded text-purple-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500"
                        checked={useAllRecipes}
                        onChange={(e) => setUseAllRecipes(e.target.checked)}
                        disabled={isGenerating}
                    />
                    Discover New Recipes
                </label>
                
                {/* --- AI BUTTON --- */}
                <button
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                    className="flex-grow sm:flex-grow-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generating...
                        </>
                    ) : (
                        "Auto-Generate Week"
                    )}
                </button>
            </div>
        </div>
    );
};

const DayColumn = ({ date, plannedMeals, recipes, user }) => {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNumber = date.getDate();

    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
            <div className="text-center mb-4">
                <p className="font-semibold text-gray-700 dark:text-gray-200">{dayName}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{dayNumber}</p>
            </div>
            <div className="space-y-3">
                {mealTypes.map(type => (
                    <MealSlot 
                        key={type} 
                        type={type} 
                        meal={plannedMeals[type]}
                        recipes={recipes}
                        user={user}
                    />
                ))}
            </div>
        </div>
    );
};

const MealSlot = ({ type, meal, recipes, user }) => {
    // Find the recipe details from the master list
    const recipeDetails = meal ? recipes.find(r => r.id === meal.recipeId) : null;

    const handleRemoveMeal = async () => {
        if (!meal || !user) return;
        
        // No more window.confirm
        try {
            const mealDocRef = doc(db, `users/${user.uid}/mealPlan`, meal.id);
            await deleteDoc(mealDocRef);
        } catch (error) {
            console.error("Error removing meal:", error);
            // We can't use alert, so we just log to console
        }
    };

    if (recipeDetails) {
        return (
            <div>
                 <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{type}</p>
                 <div className="relative bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center group">
                    <img 
                        src={recipeDetails.imageUrl || 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'} 
                        alt={recipeDetails.title} 
                        className="w-full h-16 object-cover rounded-md mb-2" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'; }}
                    />
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{recipeDetails.title}</p>
                    <button 
                        onClick={handleRemoveMeal}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove meal"
                    >
                        <X size={14} />
                    </button>
                 </div>
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{type}</p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-24 flex items-center justify-center">
                <PlusCircle className="text-gray-400 dark:text-gray-500" />
            </div>
        </div>
    );
};

export default MealPlanner;