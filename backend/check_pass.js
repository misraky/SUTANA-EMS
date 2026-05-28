const bcrypt = require('bcrypt');
const { db } = require('./src/config/database');

async function checkPass() {
  try {
    const user = await db('users').where({ email: 'admin@sutana.com' }).first();
    if (user) {
      const match = await bcrypt.compare('sutana@#!987', user.password);
      console.log('Password match:', match);
      console.log('User status_id:', user.status_id);
      
      const status = await db('user_statuses').where({ id: user.status_id }).first();
      console.log('Status code:', status.status_code);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkPass();
