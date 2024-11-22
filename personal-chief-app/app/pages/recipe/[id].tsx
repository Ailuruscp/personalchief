import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import RecipeCard from '../../components/RecipeCard';

type Ingredient = {
  name: string;
  amount: string;
};

type Recipe = {
  id: string;
  title: string;
  mealType: string;
  servings: number;
  difficulty: string;
  ingredients: Ingredient[];
  steps: string[];
  image: string;
};

type Props = {
  recipe: Recipe | null;
};

export default function RecipeDetails({ recipe }: Props) {
  if (!recipe) {
    return <div className="container mx-auto p-6">Recipe not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <RecipeCard
        title={recipe.title}
        mealType={recipe.mealType}
        servings={recipe.servings}
        difficulty={recipe.difficulty}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        image={recipe.image}
      />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const filePath = path.join(process.cwd(), 'data', 'recipes.json');
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const recipes = JSON.parse(fileContents);

  const paths = recipes.map((recipe: { id: string }) => ({
    params: { id: recipe.id },
  }));

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params as { id: string };
  const filePath = path.join(process.cwd(), 'data', 'recipes.json');
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const recipes = JSON.parse(fileContents);
  const recipe = recipes.find((r: { id: string }) => r.id === id) || null;

  return {
    props: { recipe },
  };
};
