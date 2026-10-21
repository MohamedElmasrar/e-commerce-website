-- Seed data. Dev credentials: admin@example.com / Admin123!  customer@example.com / Customer123!
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@example.com', '$2a$10$arLkdrX.GZQUpDrT0t9l5.BCCYwj6ZptdaAjJgWOEF8LlQTYfxh06', 'Store Admin', 'ADMIN'),
  ('customer@example.com', '$2a$10$t8H76pC86HRZw0d/k9esEuNeAlGo0dfLEynu7DM4cmo0DZ8gG8vSy', 'Jane Customer', 'CUSTOMER');

INSERT INTO categories (name, slug, description) VALUES
  ('Beverages', 'beverages', 'Coffee, tea, juices and soft drinks'),
  ('Snacks', 'snacks', 'Chips, nuts and bars'),
  ('Bakery', 'bakery', 'Fresh bread and pastries'),
  ('Dairy', 'dairy', 'Milk, cheese and yogurt'),
  ('Fruits & Vegetables', 'fruits-vegetables', 'Fresh produce'),
  ('Pantry', 'pantry', 'Staples, sauces and grains'),
  ('Frozen Foods', 'frozen-foods', 'Frozen meals and desserts');

INSERT INTO products (sku, slug, name, description, price, currency, category_id)
SELECT v.sku, v.slug, v.name, v.description, v.price, 'USD', c.id
FROM (VALUES
  ('SKU-0001', 'cold-brew-coffee-1l', 'Cold Brew Coffee 1L', 'Quality cold brew coffee 1l, sourced for freshness.', 6.99, 'beverages'),
  ('SKU-0002', 'organic-green-tea-20-bags', 'Organic Green Tea 20 Bags', 'Quality organic green tea 20 bags, sourced for freshness.', 4.49, 'beverages'),
  ('SKU-0003', 'sparkling-water-12-pack', 'Sparkling Water 12 Pack', 'Quality sparkling water 12 pack, sourced for freshness.', 7.99, 'beverages'),
  ('SKU-0004', 'orange-juice-1-5l', 'Orange Juice 1.5L', 'Quality orange juice 1.5l, sourced for freshness.', 3.99, 'beverages'),
  ('SKU-0005', 'ginger-kombucha-500ml', 'Ginger Kombucha 500ml', 'Quality ginger kombucha 500ml, sourced for freshness.', 3.49, 'beverages'),
  ('SKU-0006', 'sea-salt-potato-chips', 'Sea Salt Potato Chips', 'Quality sea salt potato chips, sourced for freshness.', 2.99, 'snacks'),
  ('SKU-0007', 'roasted-almonds-300g', 'Roasted Almonds 300g', 'Quality roasted almonds 300g, sourced for freshness.', 8.49, 'snacks'),
  ('SKU-0008', 'dark-chocolate-bar-85', 'Dark Chocolate Bar 85%', 'Quality dark chocolate bar 85%, sourced for freshness.', 3.29, 'snacks'),
  ('SKU-0009', 'granola-bars-6-pack', 'Granola Bars 6 Pack', 'Quality granola bars 6 pack, sourced for freshness.', 5.49, 'snacks'),
  ('SKU-0010', 'trail-mix-400g', 'Trail Mix 400g', 'Quality trail mix 400g, sourced for freshness.', 6.49, 'snacks'),
  ('SKU-0011', 'sourdough-loaf', 'Sourdough Loaf', 'Quality sourdough loaf, sourced for freshness.', 4.99, 'bakery'),
  ('SKU-0012', 'butter-croissants-4-pack', 'Butter Croissants 4 Pack', 'Quality butter croissants 4 pack, sourced for freshness.', 5.99, 'bakery'),
  ('SKU-0013', 'whole-wheat-bagels-6-pack', 'Whole Wheat Bagels 6 Pack', 'Quality whole wheat bagels 6 pack, sourced for freshness.', 4.29, 'bakery'),
  ('SKU-0014', 'blueberry-muffins-4-pack', 'Blueberry Muffins 4 Pack', 'Quality blueberry muffins 4 pack, sourced for freshness.', 5.49, 'bakery'),
  ('SKU-0015', 'cinnamon-rolls-4-pack', 'Cinnamon Rolls 4 Pack', 'Quality cinnamon rolls 4 pack, sourced for freshness.', 6.29, 'bakery'),
  ('SKU-0016', 'whole-milk-1l', 'Whole Milk 1L', 'Quality whole milk 1l, sourced for freshness.', 1.49, 'dairy'),
  ('SKU-0017', 'greek-yogurt-500g', 'Greek Yogurt 500g', 'Quality greek yogurt 500g, sourced for freshness.', 3.99, 'dairy'),
  ('SKU-0018', 'aged-cheddar-250g', 'Aged Cheddar 250g', 'Quality aged cheddar 250g, sourced for freshness.', 5.99, 'dairy'),
  ('SKU-0019', 'salted-butter-250g', 'Salted Butter 250g', 'Quality salted butter 250g, sourced for freshness.', 3.79, 'dairy'),
  ('SKU-0020', 'mozzarella-ball-125g', 'Mozzarella Ball 125g', 'Quality mozzarella ball 125g, sourced for freshness.', 2.49, 'dairy'),
  ('SKU-0021', 'organic-bananas-1kg', 'Organic Bananas 1kg', 'Quality organic bananas 1kg, sourced for freshness.', 1.99, 'fruits-vegetables'),
  ('SKU-0022', 'hass-avocados-4-pack', 'Hass Avocados 4 Pack', 'Quality hass avocados 4 pack, sourced for freshness.', 4.99, 'fruits-vegetables'),
  ('SKU-0023', 'baby-spinach-200g', 'Baby Spinach 200g', 'Quality baby spinach 200g, sourced for freshness.', 2.79, 'fruits-vegetables'),
  ('SKU-0024', 'cherry-tomatoes-250g', 'Cherry Tomatoes 250g', 'Quality cherry tomatoes 250g, sourced for freshness.', 2.99, 'fruits-vegetables'),
  ('SKU-0025', 'gala-apples-1kg', 'Gala Apples 1kg', 'Quality gala apples 1kg, sourced for freshness.', 3.49, 'fruits-vegetables'),
  ('SKU-0026', 'extra-virgin-olive-oil-750ml', 'Extra Virgin Olive Oil 750ml', 'Quality extra virgin olive oil 750ml, sourced for freshness.', 11.99, 'pantry'),
  ('SKU-0027', 'basmati-rice-2kg', 'Basmati Rice 2kg', 'Quality basmati rice 2kg, sourced for freshness.', 6.49, 'pantry'),
  ('SKU-0028', 'spaghetti-500g', 'Spaghetti 500g', 'Quality spaghetti 500g, sourced for freshness.', 1.79, 'pantry'),
  ('SKU-0029', 'tomato-passata-700g', 'Tomato Passata 700g', 'Quality tomato passata 700g, sourced for freshness.', 2.19, 'pantry'),
  ('SKU-0030', 'wildflower-honey-350g', 'Wildflower Honey 350g', 'Quality wildflower honey 350g, sourced for freshness.', 7.49, 'pantry'),
  ('SKU-0031', 'margherita-pizza', 'Margherita Pizza', 'Quality margherita pizza, sourced for freshness.', 5.99, 'frozen-foods'),
  ('SKU-0032', 'vanilla-ice-cream-1l', 'Vanilla Ice Cream 1L', 'Quality vanilla ice cream 1l, sourced for freshness.', 4.99, 'frozen-foods'),
  ('SKU-0033', 'frozen-berry-mix-500g', 'Frozen Berry Mix 500g', 'Quality frozen berry mix 500g, sourced for freshness.', 4.49, 'frozen-foods'),
  ('SKU-0034', 'vegetable-dumplings-400g', 'Vegetable Dumplings 400g', 'Quality vegetable dumplings 400g, sourced for freshness.', 5.29, 'frozen-foods'),
  ('SKU-0035', 'garden-peas-1kg', 'Garden Peas 1kg', 'Quality garden peas 1kg, sourced for freshness.', 2.69, 'frozen-foods')
) AS v (sku, slug, name, description, price, category_slug)
JOIN categories c ON c.slug = v.category_slug;

INSERT INTO inventory (product_id, quantity_on_hand)
SELECT id, 20 + (id * 7) % 80 FROM products;

INSERT INTO stock_movements (product_id, delta, reason, reference)
SELECT product_id, quantity_on_hand, 'INITIAL', 'seed' FROM inventory;
