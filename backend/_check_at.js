const m = require('mysql2/promise');
(async () => {
  try {
    const c = await m.createConnection({host:'localhost',user:'root',password:'root',database:'sutana_ems',connectTimeout:3000});
    const [r] = await c.query("SELECT id,employee_id,action,computer_id,`timestamp`,work_date FROM attendance_records ORDER BY id");
    console.log('Records:', r.length);
    r.forEach(x => console.log(JSON.stringify(x)));
    await c.end();
  } catch(e) { console.log('ERR:'+e.message); }
})();
