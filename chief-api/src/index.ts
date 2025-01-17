/**
 * index.ts
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { Connection } from 'mysql2/promise';
import { getConnection } from './mysql'; // <-- import from mysql.ts
import OpenAI from 'openai';

async function startServer() {
  let connection: Connection;

  try {
    // 1) Initialize the MySQL connection
    connection = await getConnection();

    // 2) Create the 'recipes' table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        mealType VARCHAR(50),
        serves INT,
        difficulty VARCHAR(50),
        ingredients JSON,
        steps JSON,
        image VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Checked/created "recipes" table.');

    // 3) Load data from recipes.json IF the table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM recipes');
    const { count } = (rows as { count: number }[])[0];

    if (count === 0) {
      console.log('No records found in "recipes" table. Loading data from recipes.json...');
      const dataPath = __dirname + '/../data/recipes.json';
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); 

      for (const recipe of data) {
        await connection.execute(
          `INSERT INTO recipes 
            (id, title, mealType, serves, difficulty, ingredients, steps, image, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            recipe.id,
            recipe.title,
            recipe.mealType,
            recipe.serves,
            recipe.difficulty,
            JSON.stringify(recipe.ingredients),
            JSON.stringify(recipe.steps),
            recipe.image,
            recipe.description,
          ]
        );
      }
      console.log('Successfully loaded recipes from recipes.json into the database.');
    } else {
      console.log(`"recipes" table already has ${count} record(s). Skipping JSON import.`);
    }
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }

  // 4) Initialize Express
  const app = express();
  const port = parseInt(process.env.PORT || '8080', 10);

  // 5) Middleware
  app.use(cors({ origin: 'http://localhost:3000' }));
  app.use(express.json());

  /**
   * GET /recipes/:id
   * Retrieves a single recipe by ID
   */
  app.get('/recipes/:id', async (req: Request, res: Response): Promise<any>=> {
    const { id } = req.params;
    try {
      const [rows] = await connection.execute('SELECT * FROM recipes WHERE id = ?', [id]);
      const recipes = rows as any[];
      if (recipes.length === 0) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
      return res.json(recipes[0]);
    } catch (error) {
      console.error('Error fetching recipe by ID:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  /**
   * GET /api/recipes
   * Retrieves all recipes (no pagination).
   */
  app.get('/recipes', async (req: Request, res: Response): Promise<any>=> {
    try {
      const [rows] = await connection.execute('SELECT * FROM recipes');
      const allRecipes = rows as any[];
      return res.json(allRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  const openai = new OpenAI({
    apiKey: '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'
  });
  app.post('/ai', async (req: Request, res: Response):Promise<any> => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'No prompt provided' });
      }

      // Example: Add a system message and tweak parameters
      // System messages define context or "personality"
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant specialized in giving cooking tips and recipe ideas.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,    // How creative or random the model should be
        max_tokens: 200,     // Limit the response length
        top_p: 1,            // Nucleus sampling
      });

      const answer = chatResponse.choices[0]?.message?.content || '';
      return res.json({ response: answer });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });


  /**
   * Optional root route
   */
  app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Chief API!');
  });

  // 6) Start listening
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Call the async startServer function
startServer().catch((err) => {
  console.error('Failed to start server:', err);
});