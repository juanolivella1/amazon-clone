/*
  # Add sample products and enhance checkout

  1. New Data
    - Add sample products with detailed information
    - Include ratings, reviews, and features
  
  2. Changes
    - Add sample products for different categories
    - Include rich product descriptions and features
*/

-- Insert sample products
INSERT INTO products (name, description, price, stock, image_url, rating, reviews_count, features)
VALUES
  (
    'Echo Dot (5th Gen)',
    'Our best sounding Echo Dot yet - Enjoy an improved audio experience compared to any previous Echo Dot with Alexa for clearer vocals, deeper bass and vibrant sound in any room.',
    49.99,
    100,
    'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1500_.jpg',
    4.7,
    1250,
    '["Improved audio with clearer vocals and deeper bass", "Control your smart home", "Ask Alexa for weather updates, set timers, or play music", "Privacy controls with mic off button"]'::jsonb
  ),
  (
    'Samsung Galaxy Tab S9',
    'Experience epic entertainment on our brightest, most brilliant display ever. Write, sketch and create with the included S Pen.',
    799.99,
    50,
    'https://m.media-amazon.com/images/I/81mj-0csWeL._AC_SL1500_.jpg',
    4.8,
    892,
    '["11-inch Dynamic AMOLED 2X display", "S Pen included", "All-day battery life", "IP68 water resistance"]'::jsonb
  ),
  (
    'Apple AirPods Pro (2nd Gen)',
    'The Apple-designed H2 chip pushes advanced audio performance even further, delivering crisp, clear sound with even more detail.',
    249.99,
    75,
    'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    4.9,
    2456,
    '["Active Noise Cancellation", "Adaptive Transparency", "Personalized Spatial Audio", "Up to 6 hours of listening time"]'::jsonb
  ),
  (
    'Instant Pot Duo Plus 9-in-1',
    'The Instant Pot Duo Plus is the next evolution in the Duo Series, the #1 selling cooker in the Instant Pot family.',
    129.99,
    60,
    'https://m.media-amazon.com/images/I/71pv3dGcVdL._AC_SL1500_.jpg',
    4.7,
    1876,
    '["9 appliances in 1", "Easy-seal lid automatically seals", "15 one-touch programs", "Advanced safety features"]'::jsonb
  ),
  (
    'COSORI Air Fryer Pro LE',
    'The COSORI Pro LE Air Fryer cooks food up to 50% faster than a traditional oven and requires minimal preheating time.',
    99.99,
    45,
    'https://m.media-amazon.com/images/I/71cWGWKXj5L._AC_SL1500_.jpg',
    4.6,
    1543,
    '["5-quart capacity", "12 one-touch functions", "Dishwasher safe basket", "Recipe book included"]'::jsonb
  );