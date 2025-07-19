-- Seed data for ecommerce platform

-- Insert sample categories
INSERT INTO ecommerce_category (id, name, slug, description, icon, image, featured, active, sort_order) VALUES
('mobiles', 'Mobiles', 'mobiles', 'Latest smartphones and mobile accessories', '📱', '/placeholder.svg?height=200&width=300&text=Mobiles', true, true, 1),
('electronics', 'Electronics', 'electronics', 'Computers, laptops, and electronic gadgets', '💻', '/placeholder.svg?height=200&width=300&text=Electronics', true, true, 2),
('fashion', 'Fashion', 'fashion', 'Clothing, shoes, and fashion accessories', '👕', '/placeholder.svg?height=200&width=300&text=Fashion', true, true, 3),
('home', 'Home & Kitchen', 'home-kitchen', 'Home appliances and kitchen essentials', '🏠', '/placeholder.svg?height=200&width=300&text=Home', false, true, 4),
('books', 'Books', 'books', 'Books, e-books, and educational materials', '📚', '/placeholder.svg?height=200&width=300&text=Books', false, true, 5),
('sports', 'Sports', 'sports', 'Sports equipment and fitness accessories', '⚽', '/placeholder.svg?height=200&width=300&text=Sports', false, true, 6);

-- Insert sample products
INSERT INTO ecommerce_product (id, name, slug, description, short_description, sku, price, original_price, category_id, stock, specifications, featured, active) VALUES
('1', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'The most advanced iPhone ever with titanium design and A17 Pro chip.', 'Latest iPhone with titanium design', 'IPH15PM256', 134900.00, 159900.00, 'mobiles', 25, '{"Display": "6.7-inch Super Retina XDR", "Chip": "A17 Pro", "Camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto", "Storage": "256GB", "Battery": "Up to 29 hours video playback"}', true, true),
('2', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Ultimate Galaxy experience with S Pen and AI-powered features.', 'Premium Samsung smartphone', 'SGS24U256', 124999.00, 129999.00, 'mobiles', 18, '{"Display": "6.8-inch Dynamic AMOLED 2X", "Processor": "Snapdragon 8 Gen 3", "Camera": "200MP Main + 50MP Periscope + 12MP Ultra Wide + 10MP Telephoto", "Storage": "256GB", "Battery": "5000mAh"}', true, true),
('3', 'MacBook Air M3', 'macbook-air-m3', 'Supercharged by M3 chip for incredible performance and all-day battery life.', 'Latest MacBook Air with M3 chip', 'MBA13M3256', 114900.00, 134900.00, 'electronics', 12, '{"Chip": "Apple M3", "Display": "13.6-inch Liquid Retina", "Memory": "8GB unified memory", "Storage": "256GB SSD", "Battery": "Up to 18 hours"}', true, true),
('4', 'Sony WH-1000XM5', 'sony-wh-1000xm5', 'Industry-leading noise canceling headphones with premium sound quality.', 'Premium noise-canceling headphones', 'SNYWH1000XM5', 29990.00, 34990.00, 'electronics', 45, '{"Driver": "30mm", "Frequency Response": "4Hz-40kHz", "Battery Life": "Up to 30 hours", "Connectivity": "Bluetooth 5.2, NFC", "Weight": "250g"}', false, true),
('5', 'Nike Air Force 1', 'nike-air-force-1', 'Classic basketball shoe with timeless style and comfort.', 'Classic Nike sneakers', 'NIKEAF1WHT', 7495.00, 8995.00, 'fashion', 67, '{"Upper": "Leather", "Sole": "Rubber", "Closure": "Lace-up", "Style": "Low-top", "Color": "White"}', false, true),
('6', 'Levis 511 Slim Jeans', 'levis-511-slim-jeans', 'Slim fit jeans with classic 5-pocket styling.', 'Classic slim fit jeans', 'LV511SLIM32', 2999.00, 3999.00, 'fashion', 89, '{"Fit": "Slim", "Material": "99% Cotton, 1% Elastane", "Rise": "Mid-rise", "Leg Opening": "14.5 inches", "Color": "Dark Blue"}', false, true);

-- Insert product images
INSERT INTO ecommerce_product_image (product_id, url, alt_text, sort_order, is_primary) VALUES
('1', '/placeholder.svg?height=300&width=300&text=iPhone-Main', 'iPhone 15 Pro Max main view', 0, true),
('1', '/placeholder.svg?height=300&width=300&text=iPhone-Back', 'iPhone 15 Pro Max back view', 1, false),
('1', '/placeholder.svg?height=300&width=300&text=iPhone-Side', 'iPhone 15 Pro Max side view', 2, false),
('1', '/placeholder.svg?height=300&width=300&text=iPhone-Box', 'iPhone 15 Pro Max with box', 3, false),
('2', '/placeholder.svg?height=300&width=300&text=Samsung-Main', 'Samsung Galaxy S24 Ultra main view', 0, true),
('2', '/placeholder.svg?height=300&width=300&text=Samsung-Back', 'Samsung Galaxy S24 Ultra back view', 1, false),
('3', '/placeholder.svg?height=300&width=300&text=MacBook-Main', 'MacBook Air M3 main view', 0, true),
('3', '/placeholder.svg?height=300&width=300&text=MacBook-Open', 'MacBook Air M3 open view', 1, false),
('4', '/placeholder.svg?height=300&width=300&text=Sony-Headphones', 'Sony WH-1000XM5 headphones', 0, true),
('5', '/placeholder.svg?height=300&width=300&text=Nike-Shoes', 'Nike Air Force 1 shoes', 0, true),
('6', '/placeholder.svg?height=300&width=300&text=Levis-Jeans', 'Levis 511 Slim Jeans', 0, true);

-- Insert sample admin user
INSERT INTO ecommerce_user (id, name, email, role, created_at) VALUES
('admin-1', 'Admin User', 'admin@ecommerce.com', 'admin', CURRENT_TIMESTAMP),
('user-1', 'John Doe', 'user@example.com', 'user', CURRENT_TIMESTAMP),
('user-2', 'Jane Smith', 'jane@example.com', 'user', CURRENT_TIMESTAMP);

-- Insert sample addresses
INSERT INTO ecommerce_address (user_id, type, first_name, last_name, phone, address_line1, city, state, postal_code, country, is_default) VALUES
('user-1', 'shipping', 'John', 'Doe', '+91 9876543210', '123 Main Street, Apartment 4B', 'Mumbai', 'Maharashtra', '400001', 'India', true),
('user-1', 'billing', 'John', 'Doe', '+91 9876543210', '123 Main Street, Apartment 4B', 'Mumbai', 'Maharashtra', '400001', 'India', false),
('user-2', 'shipping', 'Jane', 'Smith', '+91 9876543211', '456 Oak Avenue', 'Delhi', 'Delhi', '110001', 'India', true);

-- Insert sample orders
INSERT INTO ecommerce_order (id, order_number, user_id, status, payment_status, payment_method, subtotal, tax_amount, shipping_amount, total_amount, shipping_address) VALUES
('order-1', 'ORD001', 'user-1', 'delivered', 'paid', 'card', 134900.00, 0.00, 0.00, 134900.00, '{"firstName": "John", "lastName": "Doe", "phone": "+91 9876543210", "addressLine1": "123 Main Street, Apartment 4B", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "country": "India"}'),
('order-2', 'ORD002', 'user-1', 'shipped', 'paid', 'upi', 44980.00, 0.00, 0.00, 44980.00, '{"firstName": "John", "lastName": "Doe", "phone": "+91 9876543210", "addressLine1": "123 Main Street, Apartment 4B", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "country": "India"}');

-- Insert order items
INSERT INTO ecommerce_order_item (order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price) VALUES
('order-1', '1', 'iPhone 15 Pro Max', 'IPH15PM256', '/placeholder.svg?height=100&width=100', 1, 134900.00, 134900.00),
('order-2', '4', 'Sony WH-1000XM5', 'SNYWH1000XM5', '/placeholder.svg?height=100&width=100', 1, 29990.00, 29990.00),
('order-2', '5', 'Nike Air Force 1', 'NIKEAF1WHT', '/placeholder.svg?height=100&width=100', 2, 7495.00, 14990.00);

-- Insert order status history
INSERT INTO ecommerce_order_status_history (order_id, status, comment, notify_customer, created_by) VALUES
('order-1', 'pending', 'Order placed successfully', true, 'user-1'),
('order-1', 'confirmed', 'Order confirmed and being processed', true, 'admin-1'),
('order-1', 'shipped', 'Order shipped with tracking number TRK123456', true, 'admin-1'),
('order-1', 'delivered', 'Order delivered successfully', true, 'admin-1'),
('order-2', 'pending', 'Order placed successfully', true, 'user-1'),
('order-2', 'confirmed', 'Order confirmed and being processed', true, 'admin-1'),
('order-2', 'shipped', 'Order shipped with tracking number TRK789012', true, 'admin-1');

-- Insert sample product reviews
INSERT INTO ecommerce_product_review (product_id, user_id, order_id, rating, title, comment, verified, approved) VALUES
('1', 'user-1', 'order-1', 5, 'Excellent phone!', 'Amazing camera quality and performance. Highly recommended!', true, true),
('4', 'user-1', 'order-2', 4, 'Great headphones', 'Excellent noise cancellation, but a bit pricey.', true, true);

-- Insert sample coupons
INSERT INTO ecommerce_coupon (code, name, description, type, value, minimum_amount, usage_limit, active, expires_at) VALUES
('WELCOME10', 'Welcome Discount', 'Get 10% off on your first order', 'percentage', 10.00, 1000.00, 100, true, '2024-12-31 23:59:59'),
('SAVE500', 'Save ₹500', 'Get ₹500 off on orders above ₹5000', 'fixed', 500.00, 5000.00, 50, true, '2024-12-31 23:59:59'),
('FREESHIP', 'Free Shipping', 'Free shipping on all orders', 'free_shipping', 0.00, 499.00, NULL, true, '2024-12-31 23:59:59');

-- Insert sample notifications
INSERT INTO ecommerce_notification (user_id, type, title, message, data) VALUES
('user-1', 'order_update', 'Order Delivered', 'Your order ORD001 has been delivered successfully!', '{"orderId": "order-1", "orderNumber": "ORD001"}'),
('user-1', 'order_update', 'Order Shipped', 'Your order ORD002 has been shipped and is on its way!', '{"orderId": "order-2", "orderNumber": "ORD002", "trackingNumber": "TRK789012"}');

-- Update product counts in categories (this would normally be done via triggers or computed columns)
UPDATE ecommerce_category SET 
  sort_order = (
    CASE 
      WHEN id = 'mobiles' THEN 1
      WHEN id = 'electronics' THEN 2  
      WHEN id = 'fashion' THEN 3
      WHEN id = 'home' THEN 4
      WHEN id = 'books' THEN 5
      WHEN id = 'sports' THEN 6
      ELSE 999
    END
  );
