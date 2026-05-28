const { db } = require('./src/config/database');

async function checkUsers() {
  try {
    const users = await db('users').select('email');
    console.log(users);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
