const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch(err) {
    res.status(400).send(err);
  }
});

// GET /tasks?completed=false
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if(req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if(req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch(err) {
    res.status(500).send();
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    
    if(!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch(err) {
    res.status(500).send();
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if(!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updaets!' });
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if(!task) {
      return res.status(404).send();
    }

    updates.forEach(update => task[update] = req.body[update]);
    await task.save();
    res.send(task);
  } catch(err) {
    res.status(400).send(err);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if(!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch(err) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
      return cb(new Error('File must be a jpeg, jpg or png!'));
    }

    cb(undefined, true);
  }
});

router.post('/tasks/:id/image', auth, upload.single('image'), async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

  task.image = buffer;
  await task.save();
  res.send();
}, (error, req, res, next) => {
  res.send({ error: error.message });
});

router.delete('/tasks/:id/image', auth, async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
  task.image = undefined;
  await task.save();
  res.send();
});

router.get('/tasks/:id/image', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if(!task || !task.image) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(task.image);
  } catch(err) {
    res.status(404).send();
  }
});

module.exports = router;