const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const addUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const newUser = new User({
      username: 'alivpsuahim',
      email: 'alivpsuahim@gmail.com',
      password: '123456',
      role: 'Administrator',
      isActive: true,
    });

    await newUser.save();
    console.log('User alivpsuahim@gmail.com added successfully!');
    process.exit();
  } catch (error) {
    if (error.code === 11000) {
      console.log('User already exists in the database.');
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

addUser();
