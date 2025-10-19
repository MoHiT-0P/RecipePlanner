import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Corrected import
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { BookPlus, ChefHat, Users, Trash2, Loader, AlertCircle, Eye, X, Pencil } from 'lucide-react';

// Main Admin Component with View Management
export default function Admin() {
  const [view, setView] = useState('manageRecipes'); // Default view

  const renderView = () => {
    switch (view) {
      case 'addRecipe':
        return <AddRecipeForm />;
      case 'manageUsers':
        return <ManageUsers />;
      case 'manageRecipes':
      default:
        return <ManageRecipes />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <header className="flex items-center justify-between mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <nav className="flex items-center gap-2">
          <AdminNavButton icon={<ChefHat />} label="Manage Recipes" active={view === 'manageRecipes'} onClick={() => setView('manageRecipes')} />
          <AdminNavButton icon={<Users />} label="Manage Users" active={view === 'manageUsers'} onClick={() => setView('manageUsers')} />
          <AdminNavButton icon={<BookPlus />} label="Add Recipe" active={view === 'addRecipe'} onClick={() => setView('addRecipe')} />
        </nav>
      </header>
      <main>
        {renderView()}
      </main>
    </div>
  );
}

const AdminNavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
    {icon}
    <span>{label}</span>
  </button>
);


// --- Sub-component: Manage Recipes ---
const ManageRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // For viewing
  const [editingRecipe, setEditingRecipe] = useState(null); // For editing

  const fetchRecipes = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "recipes"));
    const recipesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRecipes(recipesList);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, "recipes", id));
            setRecipes(recipes.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error removing document: ", error);
            alert("Failed to delete recipe.");
        }
    }
  };

  const handleUpdate = (updatedRecipe) => {
    setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  };

  if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin text-green-600" size={48} /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Manage Recipes ({recipes.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm font-semibold text-gray-600">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Cuisine</th>
              <th className="p-4">Difficulty</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(recipe => (
              <tr key={recipe.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                <td className="p-4 font-semibold text-gray-800">{recipe.title}</td>
                <td className="p-4 text-gray-600">{recipe.cuisine}</td>
                <td className="p-4 text-gray-600">{recipe.difficulty}</td>
                <td className="p-4 flex justify-center items-center gap-2">
                   <button onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition">
                    <Eye size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); }} className="text-yellow-500 hover:text-yellow-700 p-2 rounded-full hover:bg-yellow-100 transition">
                    <Pencil size={20} />
                  </button>
                  <button onClick={(e) => handleDelete(e, recipe.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition">
                    <Trash2 size={20} />
                  </button>
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


// --- Sub-component: Manage Users ---
const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this user\'s data? This does not delete their login account.')) {
            try {
                await deleteDoc(doc(db, "users", id));
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                console.error("Error removing user data: ", error);
                alert("Failed to delete user data.");
            }
        }
    };
    
    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin text-green-600" size={48} /></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Manage Users ({users.length})</h2>
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-3 mb-4">
                <AlertCircle />
                <p><strong>Note:</strong> Deleting a user here only removes their data record, not their login account.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-sm font-semibold text-gray-600">
                        <tr>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Recipes Cooked</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                <td className="p-4 font-mono text-xs text-gray-600">{user.id}</td>
                                <td className="p-4 text-gray-800"><span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.role || 'user'}</span></td>
                                <td className="p-4 text-gray-600">{user.recipesCooked}</td>
                                <td className="p-4 flex justify-center items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition">
                                        <Eye size={20} />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, user.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition">
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    );
};

// --- Sub-component: Add Recipe Form ---
const AddRecipeForm = () => {
    const [recipe, setRecipe] = useState({
        title: '', description: '', ingredients: '', instructions: '',
        cuisine: '', tags: '', dietaryType: 'Veg', prepTime: 0, cookTime: 0,
        servings: 0, totalCalories: 0, difficulty: 'Easy', imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecipe(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const ingredientsArray = recipe.ingredients.split(',').map(item => item.trim());
            const instructionsArray = recipe.instructions.split('\n').map(item => item.trim());
            const tagsArray = recipe.tags.split(',').map(item => item.trim());

            await addDoc(collection(db, 'recipes'), {
                ...recipe,
                ingredients: ingredientsArray,
                instructions: instructionsArray,
                tags: tagsArray,
                prepTime: Number(recipe.prepTime),
                cookTime: Number(recipe.cookTime),
                servings: Number(recipe.servings),
                totalCalories: Number(recipe.totalCalories),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            setMessage('Recipe added successfully!');
            setRecipe({
                title: '', description: '', ingredients: '', instructions: '',
                cuisine: '', tags: '', dietaryType: 'Veg', prepTime: 0, cookTime: 0,
                servings: 0, totalCalories: 0, difficulty: 'Easy', imageUrl: ''
            });
        } catch (error) {
            console.error("Error adding document: ", error);
            setMessage('Error adding recipe. Please check the console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Add a New Recipe</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Form inputs are the same as before */}
                <input name="title" value={recipe.title} onChange={handleChange} placeholder="Recipe Title" className="p-3 border rounded-lg" required />
                <input name="imageUrl" value={recipe.imageUrl} onChange={handleChange} placeholder="Image URL" className="p-3 border rounded-lg" required />
                <textarea name="description" value={recipe.description} onChange={handleChange} placeholder="Description" className="p-3 border rounded-lg col-span-2" required />
                <textarea name="ingredients" value={recipe.ingredients} onChange={handleChange} placeholder="Ingredients (comma-separated)" className="p-3 border rounded-lg col-span-2" required />
                <textarea name="instructions" value={recipe.instructions} onChange={handleChange} placeholder="Instructions (one step per line)" className="p-3 border rounded-lg col-span-2" required />
                <input name="cookTime" type="number" value={recipe.cookTime} onChange={handleChange} placeholder="Cook Time (mins)" className="p-3 border rounded-lg" required />
                <input name="servings" type="number" value={recipe.servings} onChange={handleChange} placeholder="Servings" className="p-3 border rounded-lg" required />
                <input name="totalCalories" type="number" value={recipe.totalCalories} onChange={handleChange} placeholder="Total Calories" className="p-3 border rounded-lg" required />
                <select name="difficulty" value={recipe.difficulty} onChange={handleChange} className="p-3 border rounded-lg">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>
                <input name="cuisine" value={recipe.cuisine} onChange={handleChange} placeholder="Cuisine" className="p-3 border rounded-lg" required />
                <select name="dietaryType" value={recipe.dietaryType} onChange={handleChange} className="p-3 border rounded-lg">
                    <option>Veg</option>
                    <option>Non-Veg</option>
                    <option>Vegan</option>
                </select>
                <input name="tags" value={recipe.tags} onChange={handleChange} placeholder="Tags (comma-separated)" className="p-3 border rounded-lg col-span-2" />
                <div className="col-span-2">
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
                        {loading ? 'Adding...' : 'Add Recipe'}
                    </button>
                </div>
            </form>
            {message && <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
        </div>
    );
};

// --- Helper function to render Firestore values correctly ---
const renderFieldValue = (value) => {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (value && typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
        return new Date(value.seconds * 1000).toLocaleString();
    }
    return String(value);
};


// --- Modal Components ---
const RecipeDetailModal = ({ recipe, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Recipe Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
            {Object.entries(recipe).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 border-b pb-2">
                    <strong className="text-gray-600 capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}</strong>
                    <span className="text-gray-800 col-span-2 whitespace-pre-wrap">
                       {renderFieldValue(value)}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
);

const UserDetailModal = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">User Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
            {Object.entries(user).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 border-b pb-2">
                    <strong className="text-gray-600 capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}</strong>
                    <span className="text-gray-800 col-span-2">
                         {renderFieldValue(value)}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
);

// --- NEW: Edit Recipe Modal ---
const EditRecipeModal = ({ recipe, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        ...recipe,
        // Convert arrays back to strings for textarea editing
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : '',
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : '',
        tags: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const recipeRef = doc(db, 'recipes', recipe.id);
            
            const updatedData = {
                ...formData,
                ingredients: formData.ingredients.split(',').map(item => item.trim()),
                instructions: formData.instructions.split('\n').map(item => item.trim()),
                tags: formData.tags.split(',').map(item => item.trim()),
                prepTime: Number(formData.prepTime),
                cookTime: Number(formData.cookTime),
                servings: Number(formData.servings),
                totalCalories: Number(formData.totalCalories),
                updatedAt: serverTimestamp(),
            };

            await updateDoc(recipeRef, updatedData);
            onUpdate({ ...updatedData, id: recipe.id }); // Update local state
            onClose(); // Close modal
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("Failed to update recipe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Edit Recipe</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* This form is identical to AddRecipeForm but uses formData */}
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="Recipe Title" className="p-3 border rounded-lg" required />
                        <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL" className="p-3 border rounded-lg" required />
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="p-3 border rounded-lg col-span-2" required />
                        <textarea name="ingredients" value={formData.ingredients} onChange={handleChange} placeholder="Ingredients (comma-separated)" className="p-3 border rounded-lg col-span-2" required />
                        <textarea name="instructions" value={formData.instructions} onChange={handleChange} placeholder="Instructions (one step per line)" className="p-3 border rounded-lg col-span-2" required />
                        <input name="cookTime" type="number" value={formData.cookTime} onChange={handleChange} placeholder="Cook Time (mins)" className="p-3 border rounded-lg" required />
                        <input name="servings" type="number" value={formData.servings} onChange={handleChange} placeholder="Servings" className="p-3 border rounded-lg" required />
                        <input name="totalCalories" type="number" value={formData.totalCalories} onChange={handleChange} placeholder="Total Calories" className="p-3 border rounded-lg" required />
                        <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="p-3 border rounded-lg">
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                         <input name="cuisine" value={formData.cuisine} onChange={handleChange} placeholder="Cuisine" className="p-3 border rounded-lg" required />
                        <select name="dietaryType" value={formData.dietaryType} onChange={handleChange} className="p-3 border rounded-lg">
                            <option>Veg</option>
                            <option>Non-Veg</option>
                            <option>Vegan</option>
                        </select>
                        <input name="tags" value={formData.tags} onChange={handleChange} placeholder="Tags (comma-separated)" className="p-3 border rounded-lg col-span-2" />
                        <div className="col-span-2 flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

