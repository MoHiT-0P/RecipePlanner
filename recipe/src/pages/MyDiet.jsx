import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';
import { AlertCircle, Target } from 'lucide-react';

const MyDiet = ({ user }) => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [macroData, setMacroData] = useState({ protein: 0, carbs: 0, fat: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Get the start and end of the current week (Monday to Sunday)
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const startOfWeek = new Date(today.setDate(today.getDate() + mondayOffset));
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
                return {
                    name: daysOfWeek[day.getDay()],
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                };
            });
            
            let totalProtein = 0, totalCarbs = 0, totalFat = 0;

            querySnapshot.forEach((doc) => {
                const meal = doc.data();
                const mealDate = meal.date.toDate();
                const dayIndex = (mealDate.getDay() + 6) % 7; // Monday is 0, Sunday is 6
                
                if(meal.calories) dailyTotals[dayIndex].calories += meal.calories;
                
                 // NOTE: This logic needs to be updated to use real nutrition data
                 const simulatedProtein = meal.calories * 0.1; 
                 const simulatedCarbs = meal.calories * 0.1;
                 const simulatedFat = meal.calories * 0.04;

                dailyTotals[dayIndex].protein += simulatedProtein;
                dailyTotals[dayIndex].carbs += simulatedCarbs;
                dailyTotals[dayIndex].fat += simulatedFat;

                totalProtein += simulatedProtein;
                totalCarbs += simulatedCarbs;
                totalFat += simulatedFat;
            });
            
            setWeeklyData(dailyTotals);
            setMacroData({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user]);

    const pieData = [
        { name: 'Protein', value: Math.round(macroData.protein) },
        { name: 'Carbs', value: Math.round(macroData.carbs) },
        { name: 'Fat', value: Math.round(macroData.fat) },
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">My Diet Dashboard</h1>
            <p className="text-gray-500 mt-2 dark:text-gray-400">Your nutritional summary for the week.</p>
            
            {loading ? (
                <div className="text-center p-12">Loading nutritional data...</div>
            ) : (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Daily Calorie Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Daily Calorie Intake (kcal)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <XAxis dataKey="name" stroke="rgb(107 114 128)" />
                                <YAxis stroke="rgb(107 114 128)" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: 'white' }} />
                                <Bar dataKey="calories" fill="rgb(16, 185, 129)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Macro Breakdown Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Weekly Macro Breakdown</h2>
                        <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg flex items-center gap-3">
                <AlertCircle />
                <p><strong>Note:</strong> Macro data is currently an estimation based on calories. For precise tracking, ensure all recipes in your plan are imported from Spoonacular.</p>
            </div>
             <div className="mt-8 text-center bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center justify-center gap-2"><Target/> Feature Coming Soon!</h3>
                <p className="mt-2 text-blue-700 dark:text-blue-300">Ability to set personal calorie and macronutrient goals will be added here soon.</p>
            </div>
        </div>
    );
};

export default MyDiet;

