import React, { useState } from 'react';
import { db } from '../firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Target } from 'lucide-react';

const SetGoalsModal = ({ user, currentGoals, onClose }) => {
    const [goals, setGoals] = useState({
        calories: currentGoals?.calories || 2000,
        protein: currentGoals?.protein || 150,
        carbs: currentGoals?.carbs || 250,
        fat: currentGoals?.fat || 60,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGoals(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                goals: goals // Save the entire object
            });
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Error updating goals: ", error);
            alert("Failed to save your goals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Target /> Set Your Daily Goals
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <GoalInput label="Calories (kcal)" name="calories" value={goals.calories} onChange={handleChange} />
                    <GoalInput label="Protein (g)" name="protein" value={goals.protein} onChange={handleChange} />
                    <GoalInput label="Carbohydrates (g)" name="carbs" value={goals.carbs} onChange={handleChange} />
                    <GoalInput label="Fat (g)" name="fat" value={goals.fat} onChange={handleChange} />
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Saving...' : 'Save Goals'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const GoalInput = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            type="number"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required
            min="0"
            className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-gray-200"
        />
    </div>
);

export default SetGoalsModal;

