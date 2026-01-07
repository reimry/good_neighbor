/**
 * Billing Engine
 * Generates monthly bills for apartments in an OSBB
 */

const db = require('../db/connection');

/**
 * Service type definitions with default amounts
 */
const SERVICE_TYPES = {
    rent: { name: 'Орендна плата', defaultAmount: 1500.00 },
    water: { name: 'Водопостачання', defaultAmount: 120.00 },
    electricity: { name: 'Електроенергія', defaultAmount: 200.00 },
    heating: { name: 'Опалення', defaultAmount: 300.00 },
    maintenance: { name: 'Утримання будинку', defaultAmount: 250.00 },
    garbage: { name: 'Вивіз сміття', defaultAmount: 50.00 }
};

/**
 * Generate bills for a specific month and OSBB
 * @param {number} osbbId - OSBB ID
 * @param {Date} month - First day of the month (e.g., '2025-01-01')
 * @param {Object} serviceAmounts - Optional: Custom amounts per service type
 * @returns {Promise<Object>} Generation result
 */
async function generateBillsForMonth(osbbId, month, serviceAmounts = {}) {
    try {
        // Ensure month is first day of month
        const monthDate = new Date(month);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);
        
        // Get all apartments for this OSBB
        const apartmentsResult = await db.query(
            'SELECT id, number, area FROM apartments WHERE osbb_id = $1 AND number != \'ADMIN\'',
            [osbbId]
        );
        
        if (apartmentsResult.rows.length === 0) {
            return {
                success: false,
                error: 'No apartments found for this OSBB',
                generated: 0
            };
        }
        
        const apartments = apartmentsResult.rows;
        let generated = 0;
        let errors = [];
        
        // Start transaction
        await db.query('BEGIN');
        
        try {
            for (const apartment of apartments) {
                // Generate bills for each service type
                for (const [serviceType, serviceInfo] of Object.entries(SERVICE_TYPES)) {
                    // Use custom amount if provided, otherwise use default
                    const amount = serviceAmounts[serviceType] || serviceInfo.defaultAmount;
                    
                    // Check if bill already exists
                    const existingBill = await db.query(
                        'SELECT id FROM bills WHERE apartment_id = $1 AND month = $2 AND service_type = $3',
                        [apartment.id, monthDate, serviceType]
                    );
                    
                    if (existingBill.rows.length > 0) {
                        // Update existing bill
                        await db.query(
                            'UPDATE bills SET amount = $1, description = $2 WHERE id = $3',
                            [amount, serviceInfo.name, existingBill.rows[0].id]
                        );
                    } else {
                        // Create new bill
                        await db.query(
                            `INSERT INTO bills (apartment_id, month, service_type, amount, description)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [apartment.id, monthDate, serviceType, amount, serviceInfo.name]
                        );
                    }
                    generated++;
                }
            }
            
            await db.query('COMMIT');
            
            return {
                success: true,
                generated,
                apartments: apartments.length,
                month: monthDate.toISOString().substring(0, 7)
            };
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error generating bills:', err);
        return {
            success: false,
            error: err.message,
            generated: 0
        };
    }
}

/**
 * Generate bills for multiple months (simulation)
 * @param {number} osbbId - OSBB ID
 * @param {Date} startMonth - First month to generate
 * @param {number} monthsCount - Number of months to generate
 * @param {Object} serviceAmounts - Optional: Custom amounts per service type
 * @returns {Promise<Object>} Generation result
 */
async function generateBillsForPeriod(osbbId, startMonth, monthsCount, serviceAmounts = {}) {
    const results = [];
    const startDate = new Date(startMonth);
    startDate.setDate(1);
    
    for (let i = 0; i < monthsCount; i++) {
        const currentMonth = new Date(startDate);
        currentMonth.setMonth(startDate.getMonth() + i);
        
        const result = await generateBillsForMonth(osbbId, currentMonth, serviceAmounts);
        results.push({
            month: currentMonth.toISOString().substring(0, 7),
            ...result
        });
    }
    
    const totalGenerated = results.reduce((sum, r) => sum + (r.generated || 0), 0);
    const successCount = results.filter(r => r.success).length;
    
    return {
        success: successCount === monthsCount,
        totalGenerated,
        monthsProcessed: successCount,
        totalMonths: monthsCount,
        results
    };
}

/**
 * Update apartment balances based on bills
 * @param {number} osbbId - OSBB ID
 * @param {Date} month - Month to process
 * @returns {Promise<Object>} Update result
 */
async function updateBalancesFromBills(osbbId, month) {
    try {
        const monthDate = new Date(month);
        monthDate.setDate(1);
        
        // Get all bills for this month and OSBB
        const billsResult = await db.query(`
            SELECT b.apartment_id, SUM(b.amount) as total_amount
            FROM bills b
            JOIN apartments a ON b.apartment_id = a.id
            WHERE a.osbb_id = $1 AND b.month = $2
            GROUP BY b.apartment_id
        `, [osbbId, monthDate]);
        
        let updated = 0;
        
        await db.query('BEGIN');
        
        try {
            for (const bill of billsResult.rows) {
                // Subtract bill amount from balance (bills increase debt)
                await db.query(
                    'UPDATE apartments SET balance = balance - $1 WHERE id = $2',
                    [bill.total_amount, bill.apartment_id]
                );
                updated++;
            }
            
            await db.query('COMMIT');
            
            return {
                success: true,
                updated,
                month: monthDate.toISOString().substring(0, 7)
            };
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error updating balances:', err);
        return {
            success: false,
            error: err.message,
            updated: 0
        };
    }
}

module.exports = {
    generateBillsForMonth,
    generateBillsForPeriod,
    updateBalancesFromBills,
    SERVICE_TYPES
};

