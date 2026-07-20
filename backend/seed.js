const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    // Clear existing users
    await User.deleteMany();

    const users = [
      {
        username: 'admin',
        email: 'admin@pharmacy.com',
        password: 'admin', // This will be hashed by the User model's pre-save hook
        role: 'Administrator',
        isActive: true,
      }
    ];

    await User.insertMany(users);
    console.log('Admin User Created Successfully! (admin / admin)');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

seedUsers();
