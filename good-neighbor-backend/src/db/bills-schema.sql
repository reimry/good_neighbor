-- Bills/Services Table for Monthly Bills
-- This extends the schema with a bills table for tracking monthly services

CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- First day of the month (e.g., '2025-01-01')
    service_type VARCHAR(50) NOT NULL,  -- 'water', 'rent', 'maintenance', 'electricity', 'heating', etc.
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(apartment_id, month, service_type)  -- One bill per service type per month per apartment
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_apartment_month ON bills(apartment_id, month);

-- Example: Add some sample bills
-- INSERT INTO bills (apartment_id, month, service_type, amount, description) VALUES
-- ((SELECT id FROM apartments WHERE number = '42'), '2025-01-01', 'rent', 1500.00, 'Орендна плата за січень'),
-- ((SELECT id FROM apartments WHERE number = '42'), '2025-01-01', 'water', 120.50, 'Водопостачання за січень'),
-- ((SELECT id FROM apartments WHERE number = '42'), '2025-01-01', 'maintenance', 300.00, 'Утримання будинку за січень');


