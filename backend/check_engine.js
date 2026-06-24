const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'sutana_ems' });
  const [pm] = await c.execute("SELECT id, name FROM payment_methods");
  console.log('payment_methods:', JSON.stringify(pm));
  const [st] = await c.execute("SELECT id, name FROM sale_statuses");
  console.log('sale_statuses:', JSON.stringify(st));
  await c.end();
})();
