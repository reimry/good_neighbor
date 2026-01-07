/**
 * Billing Simulation Script
 * Generates bills for a one-year period to simulate OSBB life cycle
 * 
 * Usage: 
 *   node dev-scripts/simulate-billing.js [osbb_id] [start_month] [months]
 * 
 * Examples:
 *   node dev-scripts/simulate-billing.js 1 2025-01 12  (1 year from Jan 2025)
 *   node dev-scripts/simulate-billing.js 1 2024-01 24  (2 years from Jan 2024)
 */

require('dotenv').config();
const { generateBillsForPeriod, updateBalancesFromBills } = require('../src/services/billingEngine');
const db = require('../src/db/connection');

async function simulateBilling() {
    const osbbId = parseInt(process.argv[2]) || 1;
    const startMonth = process.argv[3] || '2025-01';
    const monthsCount = parseInt(process.argv[4]) || 12;
    
    console.log('📊 Billing Simulation');
    console.log('====================');
    console.log(`OSBB ID: ${osbbId}`);
    console.log(`Start Month: ${startMonth}`);
    console.log(`Months: ${monthsCount}`);
    console.log('');
    
    try {
        // Verify OSBB exists
        const osbbResult = await db.query(
            'SELECT id, full_name, edrpou FROM osbb_organizations WHERE id = $1',
            [osbbId]
        );
        
        if (osbbResult.rows.length === 0) {
            console.log('❌ OSBB not found');
            process.exit(1);
        }
        
        const osbb = osbbResult.rows[0];
        console.log(`✅ OSBB: ${osbb.full_name} (EDRPOU: ${osbb.edrpou})`);
        
        // Get apartment count
        const aptResult = await db.query(
            'SELECT COUNT(*) as count FROM apartments WHERE osbb_id = $1 AND number != \'ADMIN\'',
            [osbbId]
        );
        const aptCount = parseInt(aptResult.rows[0].count);
        console.log(`📦 Apartments: ${aptCount}`);
        console.log('');
        
        if (aptCount === 0) {
            console.log('⚠️  No apartments found for this OSBB');
            process.exit(1);
        }
        
        // Optional: Custom service amounts (can be modified)
        const customAmounts = {
            // rent: 1500.00,
            // water: 120.00,
            // electricity: 200.00,
            // heating: 300.00,
            // maintenance: 250.00,
            // garbage: 50.00
        };
        
        console.log('🔄 Generating bills...');
        const startDate = new Date(startMonth + '-01');
        const result = await generateBillsForPeriod(osbbId, startDate, monthsCount, customAmounts);
        
        console.log('');
        if (result.success) {
            console.log('✅ Bills generated successfully!');
            console.log(`   Total bills: ${result.totalGenerated}`);
            console.log(`   Months processed: ${result.monthsProcessed}/${result.totalMonths}`);
            console.log(`   Bills per apartment per month: ${result.totalGenerated / (aptCount * result.monthsProcessed)}`);
        } else {
            console.log('⚠️  Some errors occurred:');
            result.results.forEach(r => {
                if (!r.success) {
                    console.log(`   ${r.month}: ${r.error}`);
                }
            });
        }
        
        // Optionally update balances
        console.log('');
        console.log('💰 Updating apartment balances...');
        let balanceUpdates = 0;
        for (let i = 0; i < monthsCount; i++) {
            const currentMonth = new Date(startDate);
            currentMonth.setMonth(startDate.getMonth() + i);
            const balanceResult = await updateBalancesFromBills(osbbId, currentMonth);
            if (balanceResult.success) {
                balanceUpdates += balanceResult.updated;
            }
        }
        console.log(`✅ Updated balances for ${balanceUpdates} apartment-months`);
        
        console.log('');
        console.log('📈 Simulation complete!');
        console.log('');
        console.log('💡 Next steps:');
        console.log('   1. Check bills: SELECT * FROM bills WHERE month >= \'' + startMonth + '-01\'');
        console.log('   2. Check balances: SELECT number, balance FROM apartments WHERE osbb_id = ' + osbbId);
        console.log('   3. View in frontend: /services page');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

simulateBilling();

