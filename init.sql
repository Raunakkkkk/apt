-- Database initialization script for real-time orders system
-- Creates orders table and triggers for NOTIFY/LISTEN functionality

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'shipped', 'delivered')) NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to notify on orders changes
CREATE OR REPLACE FUNCTION notify_orders_change()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE
        notification JSON;
    BEGIN
        -- Create notification payload with operation type and data
        IF TG_OP = 'DELETE' THEN
            notification = json_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'data', row_to_json(OLD),
                'timestamp', EXTRACT(EPOCH FROM NOW())
            );
        ELSE
            notification = json_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'data', row_to_json(NEW),
                'timestamp', EXTRACT(EPOCH FROM NOW())
            );
        END IF;
        
        -- Send notification on 'orders_changes' channel
        PERFORM pg_notify('orders_changes', notification::text);
        
        -- Return appropriate row based on operation
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT, UPDATE, and DELETE operations
DROP TRIGGER IF EXISTS orders_insert_trigger ON orders;
DROP TRIGGER IF EXISTS orders_update_trigger ON orders;
DROP TRIGGER IF EXISTS orders_delete_trigger ON orders;

CREATE TRIGGER orders_insert_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_orders_change();

CREATE TRIGGER orders_update_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_orders_change();

CREATE TRIGGER orders_delete_trigger
    AFTER DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_orders_change();

-- Update the updated_at timestamp automatically on updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO orders (customer_name, product_name, status) VALUES
    ('John Doe', 'Laptop', 'pending'),
    ('Jane Smith', 'Phone', 'shipped'),
    ('Bob Johnson', 'Tablet', 'delivered');

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON orders TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO your_app_user;

