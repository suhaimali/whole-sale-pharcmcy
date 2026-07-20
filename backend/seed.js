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
        username: 'alivpsuahim',
        email: 'alivpsuahim@gmail.com',
        password: '123456',
        role: 'Administrator',
        isActive: true,
      }
    ];

    await User.insertMany(users);
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

seedUsers();
