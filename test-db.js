const { db } = require('./backend/src/config/database');

async function test() {
  try {
    const users = await db('users').select('id', 'email', 'status_id', 'full_name');
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
