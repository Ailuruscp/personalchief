import Image from "next/image";

import { GetStaticProps } from 'next';
import RecipeList from './components/RecipeList';
import fs from 'fs';
import path from 'path';

export default function Home({ recipes }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Recipe List</h1>
      <RecipeList recipes={recipes} />
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const filePath = path.join(process.cwd(), 'data', 'recipes.json');
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const recipes = JSON.parse(fileContents);

  return {
    props: {
      recipes,
    },
  };
};
