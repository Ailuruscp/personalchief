import { createConnection, Connection } from 'mysql2/promise';

export async function getConnection(): Promise<Connection> {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zx971027',
    database: 'recipesDB'
  });
  return connection;
}