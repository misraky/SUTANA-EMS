require('dotenv').config();
const { db } = require('./src/config/database');

async function run() {
    try {
        console.log('Checking payment_methods table...');
        const methods = await db('payment_methods').select('id', 'name');
        console.log('Existing payment methods:', methods);

        const creditExists = methods.find(m => m.name === 'Credit');
        if (!creditExists) {
            console.log('\nInserting "Credit" payment method...');
            await db('payment_methods').insert({
                name: 'Credit',
                requires_reference: false,
                is_active: true
            });
            console.log('✅ "Credit" payment method added.');
        } else {
            console.log(`\n✅ "Credit" already exists with id=${creditExists.id}`);
        }

        const finalMethods = await db('payment_methods').select('id', 'name');
        console.log('\nFinal payment methods:', finalMethods);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
