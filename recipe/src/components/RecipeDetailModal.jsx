import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { X, Download, PlusCircle, CalendarPlus } from 'lucide-react';
import AddToPlanModal from './AddToPlanModal.jsx'; // Import the new modal

const RecipeDetailModal = ({ user, recipe, onClose, onLogMeal }) => { // Pass user prop
    const [showAddToPlan, setShowAddToPlan] = useState(false); // State to control the new modal

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const margin = 15; let y = 20;
        doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.text(recipe.title, margin, y); y += 15;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal'); const descriptionLines = doc.splitTextToSize(recipe.description, 180); doc.text(descriptionLines, margin, y); y += descriptionLines.length * 5 + 10;
        doc.setFont('helvetica', 'bold'); doc.text(`Cook Time:`, margin, y); doc.setFont('helvetica', 'normal'); doc.text(`${recipe.cookTime} minutes`, margin + 35, y);
        doc.setFont('helvetica', 'bold'); doc.text(`Calories:`, margin + 80, y); doc.setFont('helvetica', 'normal'); doc.text(`${recipe.totalCalories} kcal`, margin + 105, y); y += 10;
        doc.setLineWidth(0.5); doc.line(margin, y - 5, 200, y - 5); doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text("Ingredients", margin, y); y += 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal'); recipe.ingredients?.forEach(ing => { if (y > 280) { doc.addPage(); y = margin; } doc.text(`•  ${ing}`, margin, y); y += 7; });
        y += 5; doc.setLineWidth(0.5); doc.line(margin, y - 5, 200, y - 5); doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text("Instructions", margin, y); y += 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal'); recipe.instructions?.forEach((step, index) => { const stepText = `${index + 1}. ${step}`; const stepLines = doc.splitTextToSize(stepText, 180); if (y + (stepLines.length * 7) > 280) { doc.addPage(); y = margin; } doc.text(stepLines, margin, y); y += stepLines.length * 7 + 3; });
        doc.save(`${recipe.title.replace(/\s+/g, '-')}.pdf`);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{recipe.title}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                    </header>
                    <div className="overflow-y-auto p-6">
                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{recipe.description}</p>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Ingredients</h3>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4">
                            {recipe.ingredients?.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">
                            {recipe.instructions?.map((item, i) => <li key={i}>{item}</li>)}
                        </ol>
                    </div>
                    <footer className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 grid grid-cols-2 gap-4">
                        <button onClick={handleDownloadPdf} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"><Download size={20} />Download PDF</button>
                        {/* UPDATED BUTTON */}
                        <button onClick={() => setShowAddToPlan(true)} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition"><CalendarPlus size={20} />Add to Meal Plan</button>
                    </footer>
                </div>
            </div>
            {/* RENDER THE NEW MODAL */}
            {showAddToPlan && <AddToPlanModal user={user} recipe={recipe} onClose={() => setShowAddToPlan(false)} />}
        </>
    );
};

export default RecipeDetailModal;

