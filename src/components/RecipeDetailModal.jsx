import React, { useState } from 'react';
import { X, Clock, Users, Download, Plus, Calendar, Utensils } from 'lucide-react';

// --- Internal AddToPlanModal Component ---
const AddToPlanModal = ({ onLogMealSubmit, onClose }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [mealType, setMealType] = useState('Breakfast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const planDate = new Date(selectedDate + 'T00:00:00');
        const beginningOfToday = new Date();
        beginningOfToday.setHours(0, 0, 0, 0);

        if (planDate < beginningOfToday) {
            setError("Cannot add meals to past dates.");
            setLoading(false);
            return;
        }

        try {
            await onLogMealSubmit(selectedDate, mealType);
            onClose();
        } catch (err) {
            console.error("Error in onLogMealSubmit callback: ", err);
            setError("Failed to add meal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add to Meal Plan</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                min={today}
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
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
                        {loading ? 'Adding...' : 'Add Meal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main RecipeDetailModal Component ---
const RecipeDetailModal = ({ recipe, onClose, onLogMeal }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showAddToPlan, setShowAddToPlan] = useState(false);

    // --- PDF GENERATION LOGIC (Script Injection Method) ---
    const generatePdf = (jsPDF) => {
        try {
            const doc = new jsPDF();
            const margin = 15;
            let y = 20;

            doc.setFontSize(22);
            doc.text(recipe.title, margin, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.text(`Cuisine: ${recipe.cuisine || 'N/A'}`, margin, y); y += 7;
            doc.text(`Difficulty: ${recipe.difficulty || 'N/A'}`, margin, y); y += 7;
            doc.text(`Total Time: ${recipe.totalTime || recipe.cookTime || 'N/A'} mins`, margin, y); y += 7;
            doc.text(`Servings: ${recipe.servings || 'N/A'}`, margin, y); y += 7;
            doc.text(`Calories: ${recipe.totalCalories || 'N/A'} kcal`, margin, y); y += 10;

            doc.setLineWidth(0.5);
            doc.line(margin, y, 195, y);
            y += 10;

            doc.setFontSize(16);
            doc.text("Ingredients:", margin, y);
            y += 8;
            doc.setFontSize(12);
            
            const ingredients = recipe.ingredients || [];
            ingredients.forEach(ing => {
                const text = typeof ing === 'object' ? ing.original : ing;
                const lines = doc.splitTextToSize(`• ${text}`, 180);
                
                if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
                doc.text(lines, margin, y);
                y += lines.length * 7;
            });

            y += 5;
            doc.setLineWidth(0.5);
            doc.line(margin, y, 195, y);
            y += 10;

            doc.setFontSize(16);
            doc.text("Instructions:", margin, y);
            y += 8;
            doc.setFontSize(12);
            
            const instructions = recipe.instructions || [];
            instructions.forEach((inst, index) => {
                const text = `${index + 1}. ${inst}`;
                const lines = doc.splitTextToSize(text, 180);
                
                if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
                doc.text(lines, margin, y);
                y += lines.length * 7 + 3;
            });

            doc.save(`${recipe.title.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPdf = () => {
        setIsDownloading(true);
        
        // Use window.jspdf from the loaded script
        if (window.jspdf && window.jspdf.jsPDF) {
            generatePdf(window.jspdf.jsPDF);
            return;
        }
        
        // Check if previously loaded but attached differently (some versions attach to window.jsPDF)
        if (window.jsPDF) {
             generatePdf(window.jsPDF);
             return;
        }

        const scriptId = 'jspdf-script';
        if (document.getElementById(scriptId)) {
             const script = document.getElementById(scriptId);
             script.addEventListener('load', () => {
                 if (window.jspdf && window.jspdf.jsPDF) generatePdf(window.jspdf.jsPDF);
                 else if (window.jsPDF) generatePdf(window.jsPDF);
             });
             return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        // Use a UMD build from a reliable CDN that attaches to window
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        script.onload = () => {
            // jspdf.umd.min.js exposes the library as window.jspdf
            if (window.jspdf && window.jspdf.jsPDF) {
                generatePdf(window.jspdf.jsPDF);
            } else {
                console.error("jsPDF not found on window after script load");
                setIsDownloading(false);
            }
        };
        script.onerror = () => {
            console.error("Failed to load jsPDF script");
            setIsDownloading(false);
            alert("Could not load PDF generator.");
        };
        document.body.appendChild(script);
    };

    const handleLogMealSubmit = async (selectedDate, mealType) => {
        if (onLogMeal) {
            await onLogMeal(recipe, selectedDate, mealType);
            setShowAddToPlan(false);
        } else {
            console.error("onLogMeal function is not defined");
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{recipe.title}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"><X size={24} /></button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/22c55e/FFFFFF?text=Recipe'; }} />
                            <div className="flex justify-around items-center mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-center">
                                    <Clock className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.totalTime || recipe.cookTime || 'N/A'} min</p>
                                </div>
                                <div className="text-center">
                                    <Users className="mx-auto text-green-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{recipe.servings || 'N/A'} servings</p>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-green-600">{recipe.totalCalories || 'N/A'}</span>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">kcal</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <p><span className="font-semibold dark:text-gray-200">Cuisine:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.cuisine}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Difficulty:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.difficulty}</span></p>
                                <p><span className="font-semibold dark:text-gray-200">Diet:</span> <span className="text-gray-600 dark:text-gray-300">{recipe.dietaryType}</span></p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Ingredients</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                                    {(recipe.ingredients || []).map((ing, i) => (
                                        <li key={i}>{typeof ing === 'object' ? ing.original : ing}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Instructions</h3>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                                    {(recipe.instructions || []).map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>

                    <footer className="p-4 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                        >
                            <Download size={18} />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={() => setShowAddToPlan(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            <Plus size={18} />
                            Add to Meal Plan
                        </button>
                    </footer>
                </div>
            </div>

            {showAddToPlan && (
                <AddToPlanModal
                    onClose={() => setShowAddToPlan(false)}
                    onLogMealSubmit={handleLogMealSubmit}
                />
            )}
        </>
    );
};

export default RecipeDetailModal;