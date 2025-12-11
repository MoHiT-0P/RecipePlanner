import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot, query, where, doc, Timestamp } from 'firebase/firestore';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    AreaChart, 
    Area, 
    CartesianGrid 
} from 'recharts';
import { 
    AlertCircle, 
    Target, 
    Pencil, 
    TrendingUp, 
    Activity, 
    Utensils, 
    Droplet,
    Calendar as CalendarIcon
} from 'lucide-react';
import SetGoalsModal from '../components/SetGoalsModal.jsx'; 

// --- Helper Components ---

const StatCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color.bg}`}>
                <Icon size={22} className={color.text} />
            </div>
            {trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">{title}</h4>
        <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{unit}</span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-xs">
                <p className="font-bold mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const MyDiet = ({ user, userData, recipes }) => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [macroData, setMacroData] = useState({ protein: 0, carbs: 0, fat: 0 });
    const [avgCalories, setAvgCalories] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    
    // User Goals (fallback to defaults)
    const goals = userData?.dietaryGoals || { calories: 2000, protein: 150, carbs: 250, fat: 60 };

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const today = new Date();
        const currentDay = today.getDay(); // 0 is Sunday
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate offset to Monday
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Firestore Query for this week's meals
        const q = query(
            collection(db, `users/${user.uid}/mealPlan`),
            where("date", ">=", Timestamp.fromDate(startOfWeek)),
            where("date", "<=", Timestamp.fromDate(endOfWeek))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const meals = snapshot.docs.map(doc => doc.data());
            processDietData(meals, startOfWeek);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, recipes]); // Re-run if recipes change (to get macro details)

    const processDietData = (meals, startOfWeek) => {
        // Initialize 7 days of data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyStats = days.map(day => ({ name: day, calories: 0, protein: 0, carbs: 0, fat: 0 }));
        
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;
        let daysWithFood = 0;

        meals.forEach(meal => {
            // Find the full recipe object to get detailed macros (if available in 'recipes' prop)
            // Note: If your 'recipes' list has full nutrition info, use it here.
            // If not, we might only have 'calories' stored in the meal plan document.
            // For this demo, I'll assume we simulate macros based on calories if missing, 
            // or use data from the meal doc if you stored it.
            
            // Convert Firestore Timestamp to JS Date
            const mealDate = meal.date.toDate();
            // Calculate index (0 for Mon, 6 for Sun)
            let dayIndex = mealDate.getDay() - 1; 
            if (dayIndex === -1) dayIndex = 6; // Sunday fix

            // Use stored calories, or 0
            const cals = parseInt(meal.calories) || 0;
            
            // --- Mock Macro Calculation (Replace with real data if you have it) ---
            // Assuming simplified ratios for demo if real data is missing:
            // Protein ~ 25% of cals / 4
            // Carbs ~ 45% of cals / 4
            // Fat ~ 30% of cals / 9
            // Ideally, you'd store protein/carbs/fat in the 'mealPlan' document when logging.
            const prot = Math.round((cals * 0.25) / 4); 
            const carb = Math.round((cals * 0.45) / 4);
            const fat = Math.round((cals * 0.30) / 9);

            weeklyStats[dayIndex].calories += cals;
            weeklyStats[dayIndex].protein += prot;
            weeklyStats[dayIndex].carbs += carb;
            weeklyStats[dayIndex].fat += fat;

            totalCalories += cals;
            totalProtein += prot;
            totalCarbs += carb;
            totalFat += fat;
        });

        // Count days that actually have data to calculate meaningful averages
        daysWithFood = weeklyStats.filter(d => d.calories > 0).length || 1;

        setWeeklyData(weeklyStats);
        setMacroData({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
        setAvgCalories(Math.round(totalCalories / daysWithFood));
    };

    // Colors for Charts
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Green, Blue, Orange

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading diet analytics...</div>;
    }

    // Prepare Pie Data
    const pieData = [
        { name: 'Protein', value: macroData.protein },
        { name: 'Carbs', value: macroData.carbs },
        { name: 'Fat', value: macroData.fat },
    ];

    // Check if empty
    const isEmpty = weeklyData.every(d => d.calories === 0);

    return (
        <div className="pb-20 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Insights</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your progress and hit your goals.</p>
                </div>
                <button 
                    onClick={() => setShowGoalsModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-md hover:scale-105 transition-transform"
                >
                    <Target size={18} /> Update Goals
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Avg. Daily Calories" 
                    value={avgCalories} 
                    unit="kcal" 
                    icon={Flame} 
                    color={{ bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' }}
                    trend={avgCalories > 0 ? Math.round(((avgCalories - goals.calories)/goals.calories)*100) : 0}
                />
                <StatCard 
                    title="Protein Intake" 
                    value={Math.round(macroData.protein / 7)} // Weekly avg
                    unit="g/day" 
                    icon={Activity} 
                    color={{ bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' }}
                />
                <StatCard 
                    title="Carb Intake" 
                    value={Math.round(macroData.carbs / 7)} 
                    unit="g/day" 
                    icon={Utensils} 
                    color={{ bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }}
                />
                <StatCard 
                    title="Fat Intake" 
                    value={Math.round(macroData.fat / 7)} 
                    unit="g/day" 
                    icon={Droplet} 
                    color={{ bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' }}
                />
            </div>

            {isEmpty ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">No data for this week</h3>
                    <p className="mt-2 text-gray-500">Log some meals in your planner to see your nutrition stats.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Calorie Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" /> Weekly Calorie Trend
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyData}>
                                    <defs>
                                        <linearGradient id="colorCals" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="calories" 
                                        stroke="#10B981" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorCals)" 
                                    />
                                    {/* Goal Line */}
                                    <Legend iconType="circle" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Macro Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" /> Macro Balance
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Total nutrient distribution for the week.</p>
                        
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">100%</span>
                                    <span className="text-xs text-gray-500 uppercase">Ratio</span>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 space-y-3">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{entry.value}g</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <p>
                    <strong>Pro Tip:</strong> These stats are calculated based on the meals you have planned for the current week (Monday to Sunday). 
                    To improve accuracy, ensure every meal in your planner has calorie information.
                </p>
            </div>

            {showGoalsModal && <SetGoalsModal user={user} currentGoals={goals} onClose={() => setShowGoalsModal(false)} />}
        </div>
    );
};

// Extra icon needed
const Flame = ({ size = 24, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-3-2-6 1.8 1.8 4 6 5 6 1.8 1.8 3.5 1.5 5 1 0 3-1.5 5-2.5 5a2.5 2.5 0 0 1-2.5-2.5"/></svg>
);

export default MyDiet;