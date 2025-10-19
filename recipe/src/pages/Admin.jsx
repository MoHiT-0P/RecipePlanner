import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { BookPlus, ChefHat, Users, Trash2, Loader, AlertCircle, Eye, X, Pencil, DownloadCloud, Search } from 'lucide-react';

// --- IMPORTANT: Paste your Spoonacular API Key here ---
const SPOONACULAR_API_KEY = '7ff1f59785974e4fb9a2fc1c41689c78'; 
// Note: In a real production app, this key should be hidden in an environment variable.

// Main Admin Component with View Management and State Lifting
export default function Admin() {
  const [view, setView] = useState('manageRecipes');
  // NEW: State to trigger a refetch in the ManageRecipes component
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleImportSuccess = () => {
    setRefetchTrigger(count => count + 1); // Increment to trigger effect
  };

  const renderView = () => {
    switch (view) {
      case 'addRecipe':
        return <AddRecipeForm onAddSuccess={handleImportSuccess} />; // Pass handler
      case 'manageUsers':
        return <ManageUsers />;
      case 'importRecipes':
        return <ImportRecipes onImportSuccess={handleImportSuccess} />; // Pass handler
      case 'manageRecipes':
      default:
        // Pass the trigger to ManageRecipes
        return <ManageRecipes refetchTrigger={refetchTrigger} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <header className="flex items-center justify-between mb-8 border-b dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
        <nav className="flex items-center gap-2 flex-wrap">
          <AdminNavButton icon={<ChefHat />} label="Manage Recipes" active={view === 'manageRecipes'} onClick={() => setView('manageRecipes')} />
          <AdminNavButton icon={<Users />} label="Manage Users" active={view === 'manageUsers'} onClick={() => setView('manageUsers')} />
          <AdminNavButton icon={<BookPlus />} label="Add Recipe" active={view === 'addRecipe'} onClick={() => setView('addRecipe')} />
          <AdminNavButton icon={<DownloadCloud />} label="Import Recipes" active={view === 'importRecipes'} onClick={() => setView('importRecipes')} />
        </nav>
      </header>
      <main>
        {renderView()}
      </main>
    </div>
  );
}

const AdminNavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${active ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
    {icon}
    <span>{label}</span>
  </button>
);


// --- UPDATED: Import Recipes Component ---
const ImportRecipes = ({ onImportSuccess }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [importingId, setImportingId] = useState(null);

    const searchRecipes = async (e) => {
        e.preventDefault();
        if (!query) return;
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10`, {
                headers: { 'x-api-key': SPOONACULAR_API_KEY }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch recipes. Check API key and quota.');
            }
            const data = await response.json();
            setResults(data.results);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const importRecipe = async (recipeId) => {
        setImportingId(recipeId);
        try {
            const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true`, {
                headers: { 'x-api-key': SPOONACULAR_API_KEY }
            });
             if (!response.ok) throw new Error('Failed to fetch full recipe details.');
            const data = await response.json();
            const newRecipe = {
                title: data.title || 'Untitled Recipe',
                description: data.summary?.replace(/<[^>]*>?/gm, '') || 'No description available.',
                ingredients: data.extendedIngredients?.map(ing => ing.original) || [],
                instructions: data.analyzedInstructions?.[0]?.steps.map(step => step.step) || [],
                cuisine: data.cuisines?.[0] || 'Unknown',
                tags: data.dishTypes || [],
                dietaryType: data.vegetarian ? 'Veg' : (data.vegan ? 'Vegan' : 'Non-Veg'),
                prepTime: data.preparationMinutes || 0,
                cookTime: data.readyInMinutes ? data.readyInMinutes - (data.preparationMinutes || 0) : 0,
                servings: data.servings || 0,
                totalCalories: data.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 0,
                difficulty: data.readyInMinutes > 60 ? 'Hard' : (data.readyInMinutes > 30 ? 'Medium' : 'Easy'),
                imageUrl: data.image || 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image',
                createdBy: 'spoonacular_import',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                nutrition: {
                    calories: data.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 0,
                    protein: data.nutrition?.nutrients.find(n => n.name === 'Protein')?.amount || 0,
                    carbohydrates: data.nutrition?.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
                    fat: data.nutrition?.nutrients.find(n => n.name === 'Fat')?.amount || 0,
                }
            };

            await addDoc(collection(db, 'recipes'), newRecipe);
            alert(`Successfully imported "${newRecipe.title}"!`);
            onImportSuccess(); // Call the handler to trigger refetch
        } catch (err) {
            console.error(err);
            alert('Failed to import recipe. See console for details.');
        } finally {
            setImportingId(null);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Import from Spoonacular</h2>
            <form onSubmit={searchRecipes} className="flex gap-4 mb-8">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g., pasta, chicken curry..." className="flex-grow p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
                    <Search /> <span>Search</span>
                </button>
            </form>

            {loading && <div className="flex justify-center items-center p-8"><Loader className="animate-spin text-green-600" size={48} /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="space-y-4">
                {results.map(recipe => (
                    <div key={recipe.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-4">
                            <img src={recipe.image} alt={recipe.title} className="w-16 h-16 object-cover rounded-md" />
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{recipe.title}</p>
                        </div>
                        <button onClick={() => importRecipe(recipe.id)} disabled={importingId === recipe.id} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
                            {importingId === recipe.id ? <Loader className="animate-spin"/> : <DownloadCloud />}
                            <span>{importingId === recipe.id ? 'Importing...' : 'Import'}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- UPDATED: Manage Recipes Component ---
const ManageRecipes = ({ refetchTrigger }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [editingRecipe, setEditingRecipe] = useState(null);

    const fetchRecipes = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "recipes"));
        const recipesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecipes(recipesList);
        setLoading(false);
    };

    useEffect(() => {
        fetchRecipes();
    }, [refetchTrigger]); // Re-run effect when the trigger changes

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            await deleteDoc(doc(db, "recipes", id));
            fetchRecipes();
        }
    };

    const handleUpdate = (updatedRecipe) => {
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? { ...r, ...updatedRecipe } : r));
        fetchRecipes(); // Also refetch on update
    };

    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-green-500" size={48} /></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Manage Recipes ({recipes.length})</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        <tr><th className="p-4">Title</th><th className="p-4">Cuisine</th><th className="p-4">Difficulty</th><th className="p-4 text-center">Actions</th></tr>
                    </thead>
                    <tbody>
                        {recipes.map(recipe => (
                            <tr key={recipe.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                                <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">{recipe.title}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">{recipe.cuisine}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">{recipe.difficulty}</td>
                                <td className="p-4 flex justify-center items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); }} className="text-yellow-500 hover:text-yellow-700 p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-600"><Pencil size={20} /></button>
                                    <button onClick={(e) => handleDelete(e, recipe.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-gray-600"><Trash2 size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
            {editingRecipe && <EditRecipeModal recipe={editingRecipe} onClose={() => setEditingRecipe(null)} onUpdate={handleUpdate} />}
        </div>
    );
};

// --- RESTORED: Manage Users Component ---
const ManageUsers = () => {
    const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true);
    const fetchUsers = async () => { setLoading(true); const usersSnapshot = await getDocs(collection(db, "users")); setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); };
    useEffect(() => { fetchUsers(); }, []);
    const handleDelete = async (e, id) => { e.stopPropagation(); if (window.confirm("Are you sure you want to delete this user's data?")) { await deleteDoc(doc(db, "users", id)); fetchUsers(); } };
    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-green-500" size={48} /></div>;
    return ( <div><h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Manage Users ({users.length})</h2><div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg flex items-center gap-3 mb-4"><AlertCircle /><p><strong>Note:</strong> Deleting a user here only removes their data record, not their login account.</p></div><table className="w-full text-left"><thead className="bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300"><tr><th className="p-4">User ID</th><th className="p-4">Role</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{users.map(user => ( <tr key={user.id} className="border-b dark:border-gray-700"><td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{user.id}</td><td className="p-4 text-gray-800 dark:text-gray-200">{user.role || 'user'}</td><td className="p-4 flex justify-center"><button onClick={(e) => handleDelete(e, user.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-gray-600"><Trash2 size={20} /></button></td></tr>))}</tbody></table></div> );
};

// --- UPDATED: Add Recipe Form Component ---
const AddRecipeForm = ({ onAddSuccess }) => {
    const [recipe, setRecipe] = useState({ title: '', description: '', ingredients: '', instructions: '', cuisine: '', tags: '', dietaryType: 'Veg', prepTime: 0, cookTime: 0, servings: 0, totalCalories: 0, difficulty: 'Easy', imageUrl: '' });
    const [loading, setLoading] = useState(false); const [message, setMessage] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setRecipe(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); setMessage(''); try { const ingredientsArray = recipe.ingredients.split(',').map(item => item.trim()); const instructionsArray = recipe.instructions.split('\n').map(item => item.trim()); const tagsArray = recipe.tags.split(',').map(item => item.trim()); await addDoc(collection(db, 'recipes'), { ...recipe, ingredients: ingredientsArray, instructions: instructionsArray, tags: tagsArray, prepTime: Number(recipe.prepTime), cookTime: Number(recipe.cookTime), servings: Number(recipe.servings), totalCalories: Number(recipe.totalCalories), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), }); setMessage('Recipe added successfully!'); onAddSuccess(); setRecipe({ title: '', description: '', ingredients: '', instructions: '', cuisine: '', tags: '', dietaryType: 'Veg', prepTime: 0, cookTime: 0, servings: 0, totalCalories: 0, difficulty: 'Easy', imageUrl: '' }); } catch (error) { console.error("Error adding document: ", error); setMessage('Error adding recipe.'); } finally { setLoading(false); } };
    return ( <div><h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Add a New Recipe</h2><form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6"><input name="title" value={recipe.title} onChange={handleChange} placeholder="Recipe Title" className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="imageUrl" value={recipe.imageUrl} onChange={handleChange} placeholder="Image URL" className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="description" value={recipe.description} onChange={handleChange} placeholder="Description" className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="ingredients" value={recipe.ingredients} onChange={handleChange} placeholder="Ingredients (comma-separated)" className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="instructions" value={recipe.instructions} onChange={handleChange} placeholder="Instructions (one step per line)" className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="cookTime" type="number" value={recipe.cookTime} onChange={handleChange} placeholder="Cook Time (mins)" className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="servings" type="number" value={recipe.servings} onChange={handleChange} placeholder="Servings" className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="totalCalories" type="number" value={recipe.totalCalories} onChange={handleChange} placeholder="Total Calories" className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><select name="difficulty" value={recipe.difficulty} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"><option>Easy</option><option>Medium</option><option>Hard</option></select><input name="tags" value={recipe.tags} onChange={handleChange} placeholder="Tags (comma-separated)" className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" /><div className="col-span-2"><button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">{loading ? 'Adding...' : 'Add Recipe'}</button></div></form>{message && <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}</div> );
};

// --- Helper function to render Firestore values correctly ---
const renderFieldValue = (value) => {
    if (Array.isArray(value)) { return value.join(', '); }
    if (value && typeof value.seconds === 'number') { return new Date(value.seconds * 1000).toLocaleString(); }
    return String(value);
};

// --- Helper Modals for Admin Panel (Restored) ---
const RecipeDetailModal = ({ recipe, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recipe Details</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button></div>
        <div className="overflow-y-auto p-6 space-y-4">{Object.entries(recipe).map(([key, value]) => ( <div key={key} className="grid grid-cols-3 gap-4 border-b dark:border-gray-700 pb-2"><strong className="text-gray-600 dark:text-gray-400 capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}</strong><span className="text-gray-800 dark:text-gray-200 col-span-2 whitespace-pre-wrap">{renderFieldValue(value)}</span></div>))}</div>
      </div>
    </div>
);

const EditRecipeModal = ({ recipe, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ ...recipe, ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : '', instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : '', tags: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : '' });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { const recipeRef = doc(db, 'recipes', recipe.id); const updatedData = { ...formData, ingredients: formData.ingredients.split(',').map(item => item.trim()), instructions: formData.instructions.split('\n').map(item => item.trim()), tags: formData.tags.split(',').map(item => item.trim()), prepTime: Number(formData.prepTime), cookTime: Number(formData.cookTime), servings: Number(formData.servings), totalCalories: Number(formData.totalCalories), updatedAt: serverTimestamp(), }; await updateDoc(recipeRef, updatedData); onUpdate({ ...updatedData, id: recipe.id }); onClose(); } catch (error) { console.error("Error updating document: ", error); alert("Failed to update recipe."); } finally { setLoading(false); } };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"><div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Recipe</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button></div><div className="overflow-y-auto p-6"><form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6"><input name="title" value={formData.title} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="description" value={formData.description} onChange={handleChange} className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="ingredients" value={formData.ingredients} onChange={handleChange} className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><textarea name="instructions" value={formData.instructions} onChange={handleChange} className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="cookTime" type="number" value={formData.cookTime} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="servings" type="number" value={formData.servings} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><input name="totalCalories" type="number" value={formData.totalCalories} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><select name="difficulty" value={formData.difficulty} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"><option>Easy</option><option>Medium</option><option>Hard</option></select><input name="cuisine" value={formData.cuisine} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /><select name="dietaryType" value={formData.dietaryType} onChange={handleChange} className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"><option>Veg</option><option>Non-Veg</option><option>Vegan</option></select><input name="tags" value={formData.tags} onChange={handleChange} className="p-3 border rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" /><div className="col-span-2 flex justify-end gap-4"><button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 p-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button><button type="submit" disabled={loading} className="bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button></div></form></div></div></div> );
};

