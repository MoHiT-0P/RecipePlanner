import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { AlertCircle, Target, Pencil } from 'lucide-react';
import SetGoalsModal from '../components/SetGoalsModal.jsx'; // Import the new modal

const MyDiet = ({ user, userData, recipes }) => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [macroData, setMacroData] = useState({ protein: 0, carbs: 0, fat: 0 });
    const [loading, setLoading] = useState(true);
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    
    // The user's goals are now available from the userData prop
    const goals = userData?.goals || { calories: 2000, protein: 150, carbs: 250, fat: 60 };

    useEffect(() => {
        if (!user || !recipes.length) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
        const q = query(mealPlanRef, where("date", ">=", startOfWeek), where("date", "<=", endOfWeek));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dailyTotals = Array(7).fill(null).map((_, i) => {
                const day = new Date(startOfWeek);
                day.setDate(day.getDate() + i);
                return { name: daysOfWeek[day.getDay()], calories: 0, protein: 0, carbs: 0, fat: 0 };
            });
            
            let totalProtein = 0, totalCarbs = 0, totalFat = 0;

            querySnapshot.forEach((doc) => {
                const meal = doc.data();
                const mealDate = meal.date.toDate();
                const dayIndex = (mealDate.getDay() + 6) % 7;
                
                const recipeDetails = recipes.find(r => r.id === meal.recipeId);

                if (recipeDetails && recipeDetails.nutrition) {
                    const nutrition = recipeDetails.nutrition;
                    dailyTotals[dayIndex].calories += nutrition.calories || 0;
                    dailyTotals[dayIndex].protein += nutrition.protein || 0;
                    dailyTotals[dayIndex].carbs += nutrition.carbohydrates || 0;
                    dailyTotals[dayIndex].fat += nutrition.fat || 0;

                    totalProtein += nutrition.protein || 0;
                    totalCarbs += nutrition.carbohydrates || 0;
                    totalFat += nutrition.fat || 0;
                } else {
                    dailyTotals[dayIndex].calories += meal.calories || 0;
                }
            });
            
            setWeeklyData(dailyTotals);
            setMacroData({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user, recipes]);

    const pieData = [
        { name: 'Protein', value: Math.round(macroData.protein) },
        { name: 'Carbs', value: Math.round(macroData.carbs) },
        { name: 'Fat', value: Math.round(macroData.fat) },
    ].filter(entry => entry.value > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    return (
        <>
            <div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">My Diet Dashboard</h1>
                        <p className="text-gray-500 mt-2 dark:text-gray-400">Your nutritional summary for the week.</p>
                    </div>
                    <button onClick={() => setShowGoalsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        <Pencil size={18} />
                        <span>Set Goals</span>
                    </button>
                </div>
                
                {loading ? (
                    <div className="text-center p-12 dark:text-gray-300">Loading nutritional data...</div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Daily Calorie Intake (kcal)</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="name" stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'} />
                                    <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                                    {/* NEW: Goal Line */}
                                    <ReferenceLine y={goals.calories} label={{ value: `Goal: ${goals.calories}`, position: 'insideTopRight', fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="3 3" />
                                    <Bar dataKey="calories" fill="rgb(16, 185, 129)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Weekly Macro Breakdown</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <p>Goal: {goals.protein}g Protein, {goals.carbs}g Carbs, {goals.fat}g Fat</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg flex items-center gap-3">
                    <AlertCircle />
                    <p><strong>Note:</strong> For accurate macro tracking, ensure recipes in your plan are imported from Spoonacular.</p>
                </div>
            </div>
            {showGoalsModal && <SetGoalsModal user={user} currentGoals={goals} onClose={() => setShowGoalsModal(false)} />}
        </>
    );
};

export default MyDiet;

