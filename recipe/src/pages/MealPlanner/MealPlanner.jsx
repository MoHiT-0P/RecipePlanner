import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react';

// --- Helper function to get a YYYY-MM-DD string from a Date object ---
const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Main Meal Planner Component
const MealPlanner = ({ user, recipes }) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const [weekDates, setWeekDates] = useState([]);
    const [mealPlan, setMealPlan] = useState({});

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
                // **THE FIX IS HERE:** Convert timestamp to local date before getting the string
                const localDate = data.date.toDate(); 
                const dateStr = toLocalDateString(localDate);
                
                if (!plan[dateStr]) {
                    plan[dateStr] = {};
                }
                plan[dateStr][data.mealType] = { id: doc.id, ...data };
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
            />
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mt-6">
                {weekDates.map(date => (
                    <DayColumn 
                        key={date.toISOString()} 
                        date={date} 
                        // Use the corrected local date string to find meals
                        plannedMeals={mealPlan[toLocalDateString(date)] || {}}
                        recipes={recipes}
                        user={user}
                    />
                ))}
            </div>
        </div>
    );
};

// --- Helper Components for the Planner (No changes below this line) ---

const WeekNavigator = ({ startDate, endDate, onPrev, onNext }) => {
    const options = { month: 'short', day: 'numeric' };
    return (
        <div className="flex items-center justify-between mt-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <button onClick={onPrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft /></button>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {startDate.toLocaleDateString(undefined, options)} - {endDate.toLocaleDateString(undefined, { ...options, year: 'numeric' })}
            </div>
            <button onClick={onNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight /></button>
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
    const recipeDetails = meal ? recipes.find(r => r.id === meal.recipeId) : null;

    const handleRemoveMeal = async () => {
        if (!meal || !user) return;
        
        if (window.confirm(`Are you sure you want to remove "${recipeDetails.title}" from your plan?`)) {
            try {
                const mealDocRef = doc(db, `users/${user.uid}/mealPlan`, meal.id);
                await deleteDoc(mealDocRef);
            } catch (error) {
                console.error("Error removing meal:", error);
                alert("Failed to remove meal from plan.");
            }
        }
    };

    if (recipeDetails) {
        return (
            <div>
                 <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{type}</p>
                 <div className="relative bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center group">
                    <img src={recipeDetails.imageUrl} alt={recipeDetails.title} className="w-full h-16 object-cover rounded-md mb-2" />
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

