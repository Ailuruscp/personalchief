"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * index.ts
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const mysql_1 = require("./mysql"); // <-- import from mysql.ts
const openai_1 = __importDefault(require("openai"));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            // 1) Initialize the MySQL connection
            connection = yield (0, mysql_1.getConnection)();
            // 2) Create the 'recipes' table
            yield connection.execute(`
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
            const [rows] = yield connection.execute('SELECT COUNT(*) as count FROM recipes');
            const { count } = rows[0];
            if (count === 0) {
                console.log('No records found in "recipes" table. Loading data from recipes.json...');
                const dataPath = __dirname + '/../data/recipes.json';
                const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
                for (const recipe of data) {
                    yield connection.execute(`INSERT INTO recipes 
            (id, title, mealType, serves, difficulty, ingredients, steps, image, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
                        recipe.id,
                        recipe.title,
                        recipe.mealType,
                        recipe.serves,
                        recipe.difficulty,
                        JSON.stringify(recipe.ingredients),
                        JSON.stringify(recipe.steps),
                        recipe.image,
                        recipe.description,
                    ]);
                }
                console.log('Successfully loaded recipes from recipes.json into the database.');
            }
            else {
                console.log(`"recipes" table already has ${count} record(s). Skipping JSON import.`);
            }
        }
        catch (error) {
            console.error('Error during startup:', error);
            process.exit(1);
        }
        // 4) Initialize Express
        const app = (0, express_1.default)();
        const port = parseInt(process.env.PORT || '8080');
        // 5) Middleware
        app.use((0, cors_1.default)({ origin: 'http://localhost:3000' }));
        app.use(express_1.default.json());
        /**
         * GET /recipes/:id
         * Retrieves a single recipe by ID
         */
        app.get('/recipes/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const [rows] = yield connection.execute('SELECT * FROM recipes WHERE id = ?', [id]);
                const recipes = rows;
                if (recipes.length === 0) {
                    return res.status(404).json({ message: 'Recipe not found' });
                }
                return res.json(recipes[0]);
            }
            catch (error) {
                console.error('Error fetching recipe by ID:', error);
                return res.status(500).json({ message: 'Server error' });
            }
        }));
        /**
         * GET /api/recipes
         * Retrieves all recipes (no pagination).
         */
        app.get('/recipes', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield connection.execute('SELECT * FROM recipes');
                const allRecipes = rows;
                return res.json(allRecipes);
            }
            catch (error) {
                console.error('Error fetching recipes:', error);
                return res.status(500).json({ message: 'Server error' });
            }
        }));
        const openai = new openai_1.default({
            apiKey: ''
        });
        app.post('/ai', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { prompt } = req.body;
                if (!prompt) {
                    return res.status(400).json({ error: 'No prompt provided' });
                }
                // Example: Add a system message and tweak parameters
                // System messages define context or "personality"
                const chatResponse = yield openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant specialized in giving cooking tips and recipe ideas.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.7, // How creative or random the model should be
                    max_tokens: 200, // Limit the response length
                    top_p: 1, // Nucleus sampling
                });
                const answer = ((_b = (_a = chatResponse.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                return res.json({ response: answer });
            }
            catch (error) {
                console.error('OpenAI Error:', error);
                return res.status(500).json({ error: 'Server error' });
            }
        }));
        /**
         * Optional root route
         */
        app.get('/', (req, res) => {
            res.send('Welcome to the Chief API!');
        });
        // 6) Start listening
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    });
}
// Call the async startServer function
startServer().catch((err) => {
    console.error('Failed to start server:', err);
});
