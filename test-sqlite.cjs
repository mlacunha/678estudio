const { createClient } = require('@libsql/client');

async function test() {
  try {
    console.log('Testing @libsql/client with local in-memory SQLite...');
    const client = createClient({ url: ':memory:' });
    await client.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await client.execute({
      sql: 'INSERT INTO test (name) VALUES (?)',
      args: ['Caneca 678 Premium']
    });
    const result = await client.execute({
      sql: 'SELECT * FROM test WHERE name = ?',
      args: ['Caneca 678 Premium']
    });
    console.log('SQLITE_SUCCESS! Result:', result.rows);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
