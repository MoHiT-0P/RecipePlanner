import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.js';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react';

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
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday (0) vs. Monday (1)
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

        const startOfWeek = weekDates[0];
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = weekDates[6];
        endOfWeek.setHours(23, 59, 59, 999);

        const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
        const q = query(mealPlanRef, where("date", ">=", startOfWeek), where("date", "<=", endOfWeek));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const plan = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const dateStr = data.date.toDate().toISOString().split('T')[0];
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
                        plannedMeals={mealPlan[date.toISOString().split('T')[0]] || {}}
                        recipes={recipes}
                    />
                ))}
            </div>
        </div>
    );
};

// --- Helper Components for the Planner ---

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

const DayColumn = ({ date, plannedMeals, recipes }) => {
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
                    />
                ))}
            </div>
        </div>
    );
};

const MealSlot = ({ type, meal, recipes }) => {
    const recipeDetails = meal ? recipes.find(r => r.id === meal.recipeId) : null;

    if (recipeDetails) {
        return (
            <div>
                 <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{type}</p>
                 <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center">
                    <img src={recipeDetails.imageUrl} alt={recipeDetails.title} className="w-full h-16 object-cover rounded-md mb-2" />
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{recipeDetails.title}</p>
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

