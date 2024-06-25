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
  const userId = req.params._id
  const exerciseByUser = await Exercise.find({ userId: userId })
  const user = await User.findById(userId)

  const countExercise = exerciseByUser.length
  try {
    res.json({
      username: user.username,
      count: countExercise,
      _id: user._id,
      log: exerciseByUser
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
