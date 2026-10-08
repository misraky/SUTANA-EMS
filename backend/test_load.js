try {
  require('./src/app');
  console.log('OK');
} catch(e) {
  console.log('FAIL:', e.message);
  console.log(e.stack);
}
process.exit();
