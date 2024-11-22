import { useState } from 'react';
import axios from 'axios';
import RecipeCard from '../components/RecipeCard';

type Recipe = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strInstructions?: string;
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`
      );
      setRecipes(response.data.meals || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Search for a recipe"
        />
        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Search
        </button>
      </div>
      <div className="mt-6">
        {recipes.length > 0 ? (
          <ul className="space-y-4">
            {recipes.map((recipe) => (
              <li key={recipe.idMeal} className="bg-gray-100 p-4 rounded shadow">
                <h3 className="text-lg font-semibold">{recipe.strMeal}</h3>
                {recipe.strMealThumb && (
                  <img
                    src={recipe.strMealThumb}
                    alt={recipe.strMeal}
                    className="w-full h-40 object-cover rounded"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          searchTerm && <div>No recipes found.</div>
        )}
      </div>
    </div>
  );
}
