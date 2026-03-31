/**
 * Database Seed Script
 * Creates default admin user, sample products, and initial settings
 * 
 * Run: npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khetalpura_dairy');
    console.log('📦 Connected to MongoDB');

    // ============================================
    // 1. Create Admin User
    // ============================================
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        phone: '919999999999',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        isVerified: true,
        address: 'Khetalpura Dairy Farm'
      });
      console.log('✅ Admin user created (Phone: 919999999999, Password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // ============================================
    // 2. Create Staff User
    // ============================================
    const staffExists = await User.findOne({ role: 'staff' });
    if (!staffExists) {
      await User.create({
        name: 'Staff User',
        phone: '918888888888',
        password: 'staff123',
        role: 'staff',
        isActive: true,
        isVerified: true,
        address: 'Khetalpura Dairy Farm'
      });
      console.log('✅ Staff user created (Phone: 918888888888, Password: staff123)');
    }

    // ============================================
    // 3. Create Delivery Boy
    // ============================================
    const deliveryExists = await User.findOne({ role: 'delivery' });
    if (!deliveryExists) {
      await User.create({
        name: 'Delivery Boy',
        phone: '917777777777',
        password: 'delivery123',
        role: 'delivery',
        isActive: true,
        isVerified: true,
        address: 'Khetalpura Village'
      });
      console.log('✅ Delivery boy created (Phone: 917777777777, Password: delivery123)');
    }

    // ============================================
    // 4. Create Sample Products
    // ============================================
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const products = [
        // Milk
        { name: 'Full Cream Milk', nameHi: 'फुल क्रीम दूध', category: 'milk', price: 70, unit: '1 ltr', stock: 100, minStock: 20, description: 'Fresh full cream milk', descriptionHi: 'ताज़ा फुल क्रीम दूध' },
        { name: 'Toned Milk', nameHi: 'टोंड दूध', category: 'milk', price: 55, unit: '1 ltr', stock: 100, minStock: 20, description: 'Low fat toned milk', descriptionHi: 'कम वसा वाला टोंड दूध' },
        { name: 'Buffalo Milk', nameHi: 'भैंस का दूध', category: 'milk', price: 80, unit: '1 ltr', stock: 80, minStock: 15, description: 'Pure buffalo milk', descriptionHi: 'शुद्ध भैंस का दूध' },
        { name: 'Cow Milk', nameHi: 'गाय का दूध', category: 'milk', price: 60, unit: '1 ltr', stock: 80, minStock: 15, description: 'Fresh cow milk (A2)', descriptionHi: 'ताज़ा गाय का दूध (A2)' },
        { name: 'Milk (500ml)', nameHi: 'दूध (500ml)', category: 'milk', price: 35, unit: '500 ml', stock: 50, minStock: 10 },

        // Curd
        { name: 'Fresh Curd', nameHi: 'ताज़ा दही', category: 'curd', price: 50, unit: '500g', stock: 50, minStock: 10, description: 'Thick creamy curd', descriptionHi: 'गाढ़ा मलाईदार दही' },
        { name: 'Curd (1 kg)', nameHi: 'दही (1 kg)', category: 'curd', price: 90, unit: '1 kg', stock: 40, minStock: 10 },
        { name: 'Mishti Doi', nameHi: 'मिश्टी दोई', category: 'curd', price: 60, unit: '250g', stock: 30, minStock: 5 },

        // Lassi
        { name: 'Sweet Lassi', nameHi: 'मीठी लस्सी', category: 'lassi', price: 40, unit: '300 ml', stock: 40, minStock: 10, description: 'Traditional sweet lassi', descriptionHi: 'पारंपरिक मीठी लस्सी' },
        { name: 'Salt Lassi', nameHi: 'नमकीन लस्सी', category: 'lassi', price: 35, unit: '300 ml', stock: 40, minStock: 10 },
        { name: 'Mango Lassi', nameHi: 'आम लस्सी', category: 'lassi', price: 50, unit: '300 ml', stock: 30, minStock: 5 },

        // Ghee
        { name: 'Desi Ghee', nameHi: 'देसी घी', category: 'ghee', price: 650, unit: '500g', stock: 30, minStock: 5, description: 'Pure desi cow ghee', descriptionHi: 'शुद्ध देसी गाय का घी' },
        { name: 'Desi Ghee (1 kg)', nameHi: 'देसी घी (1 kg)', category: 'ghee', price: 1200, unit: '1 kg', stock: 20, minStock: 5 },
        { name: 'Buffalo Ghee', nameHi: 'भैंस का घी', category: 'ghee', price: 600, unit: '500g', stock: 25, minStock: 5 },

        // Ice Cream
        { name: 'Vanilla Ice Cream', nameHi: 'वनिला आइसक्रीम', category: 'ice_cream', price: 100, unit: '500 ml', stock: 20, minStock: 5, description: 'Rich vanilla ice cream', descriptionHi: 'शानदार वनिला आइसक्रीम' },
        { name: 'Mango Ice Cream', nameHi: 'आम आइसक्रीम', category: 'ice_cream', price: 120, unit: '500 ml', stock: 15, minStock: 5 },
        { name: 'Kulfi', nameHi: 'कुल्फी', category: 'ice_cream', price: 30, unit: 'piece', stock: 50, minStock: 10, description: 'Traditional malai kulfi', descriptionHi: 'पारंपरिक मलाई कुल्फी' }
      ];

      const createdProducts = await Product.insertMany(products);
      console.log(`✅ ${createdProducts.length} products created`);

      // Create inventory records
      const inventoryRecords = createdProducts.map(p => ({
        product: p._id,
        currentStock: p.stock,
        minThreshold: p.minStock
      }));
      await Inventory.insertMany(inventoryRecords);
      console.log(`✅ Inventory records created`);
    } else {
      console.log(`ℹ️  Products already exist (${productCount} products)`);
    }

    // ============================================
    // 5. Create Default Settings
    // ============================================
    const settings = await Settings.getSettings();
    console.log(`✅ Settings initialized: ${settings.dairyName}`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Default Credentials:');
    console.log('   Admin  → Phone: 919999999999, Password: admin123');
    console.log('   Staff  → Phone: 918888888888, Password: staff123');
    console.log('   Delivery → Phone: 917777777777, Password: delivery123');
    console.log('\n   Customer → Use any Indian number with OTP (mock mode: any 6-digit code)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDB();
