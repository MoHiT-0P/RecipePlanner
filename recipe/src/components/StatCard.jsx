import React from 'react';

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-300">
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

export default StatCard;

