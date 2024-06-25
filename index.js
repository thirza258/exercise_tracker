const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const User = require('./User');
const Exercise = require('./Exercise');

app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });

  try {
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
// Add exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exercise = new Exercise({
      userId: userId,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date()
    });

    const savedExercise = await exercise.save();
    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: new Date(savedExercise.date).toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get exercise log for a user
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const filter = { userId: _id };
    if (from) {
      filter.date = { ...filter.date, $gte: new Date(from) };
    }
    if (to) {
      filter.date = { ...filter.date, $lte: new Date(to) };
    }

    let exercises = Exercise.find(filter);
    if (limit) {
      exercises = exercises.limit(parseInt(limit));
    }

    const exerciseByUser = await exercises.exec();

    res.json({
      username: user.username,
      count: exerciseByUser.length,
      _id: user._id,
      log: exerciseByUser.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
