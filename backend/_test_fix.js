const mysql = require('mysql2/promise');
(async () => {
  try {
    const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'root',database:'sutana_ems',timezone:'+03:00'});
    // Simulate what openShift does now (without computer_id)
    const empId = 'EMP0009';
    const ts = '2026-06-20 01:00:00';
    const workDate = '2026-06-20';
    const worker_id = 9;
    try {
      await c.query("INSERT IGNORE INTO attendance_records (employee_id, action, status, timestamp, ip_address, work_date, recorded_by, created_at) VALUES (?, 'CLOCK_IN', 'Present', ?, ?, ?, ?, NOW())",
        [empId, ts, '127.0.0.1', workDate, worker_id]);
      console.log('INSERT succeeded!');
    } catch(e) { console.log('INSERT failed:', e.message); }
    const [r] = await c.query("SELECT * FROM attendance_records WHERE employee_id = 'EMP0009' ORDER BY timestamp DESC LIMIT 5");
    console.log('Attendance records found:', r.length);
    r.forEach(x => console.log(JSON.stringify({id:x.id, emp:x.employee_id, action:x.action, ts:x.timestamp, work_date:x.work_date})));
    await c.end();
  } catch(e) { console.error('ERR:', e.message); }
})();
