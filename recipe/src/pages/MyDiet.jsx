import React from 'react';

const MyDiet = ({ userData }) => (
    <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">My Diet Tracker</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">A summary of your nutritional intake for today.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-sm text-center">
                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Total Calories Today</h2>
                <p className="text-6xl font-bold text-green-600 dark:text-green-400 mt-2">{userData.caloriesToday}</p>
                <p className="text-gray-400">kcal</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-sm text-center">
                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Recipes Cooked Today</h2>
                <p className="text-6xl font-bold text-green-600 dark:text-green-400 mt-2">{userData.recipesCooked}</p>
                <p className="text-gray-400">meals</p>
            </div>
        </div>

        <div className="mt-8 text-center bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Feature Coming Soon!</h3>
            <p className="mt-2 text-blue-700 dark:text-blue-300">Detailed daily logs and nutritional charts will be available here soon.</p>
        </div>
    </div>
);

export default MyDiet;

