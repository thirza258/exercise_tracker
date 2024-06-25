const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const User = require('./User');
const Exercise = require('./Exercise');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });

  try {
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id
  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date

  const user = await User.findById(userId)
  const exercise = {
    userId: userId,
    description: description,
    duration: duration,
    date: date
  }

  try {
    const savedExercise = await Exercise.create(exercise)
    res.json({
      _id: user._id,
      username: user.username,
      date: new Date(savedExercise.date).toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = { userId: _id };
    if (from || to) {
      query.date = {};
      if (from) {
        query.date.$gte = new Date(from);
      }
      if (to) {
        query.date.$lte = new Date(to);
      }
    }

    let exerciseQuery = Exercise.find(query);
    if (limit) {
      exerciseQuery = exerciseQuery.limit(parseInt(limit));
    }

    const exercises = await exerciseQuery.exec();
    const count = exercises.length;

    res.json({
      username: user.username,
      count,
      _id: user._id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date:  new Date(exercise.date).toDateString()
      }))
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
