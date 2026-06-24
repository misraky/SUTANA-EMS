const db = require('./src/config/database');
async function insertCar() {
  try {
    await db.db.raw("INSERT INTO cars (name, daily_rate, seats, transmission, fuel_type, car_type, availability) VALUES ('Toyota Corolla', 2500, 4, 'Automatic', 'Petrol', 'Sedan', 'Available')");
    console.log('Car inserted');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
insertCar();
