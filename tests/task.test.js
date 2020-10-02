const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase
} = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll(async () => {
  await mongoose.disconnect();
});

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'test description'
    })
    .expect(201);
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test('Should get all tasks for user one', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(2);
});

test('Should fail when deleting first task as second user', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should not create task with invalid description', async () => {
  await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: ''
    })
    .expect(400);
});

test('Should not create task with invalid completed', async () => {
  await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'test description',
      completed: 'hello'
    })
    .expect(400);
});

test('Should not update task with invalid description', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: ''
    })
    .expect(400);
  const task = await Task.findById(taskOne._id);
  expect(task.description).not.toEqual('');
});

test('Should not update task with invalid completed', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'test description',
      completed: 'hello'
    
    })
    .expect(400);
  const task = await Task.findById(taskOne._id);
  expect(task.completed).not.toEqual('hello');
});

test('Should delete user task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
});

test('Should not delete task if unauthenticated', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

test('Should not update other users task', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: 'new description'
    })
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task.description).not.toEqual('new description');
});

test('Should fetch user task by id', async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not fetch user task by id if unauthenticated', async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

test('Should not fetch other users task by id', async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
});

test('Should fetch only incomplete tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
});

test('Should sort tasks by description', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=description:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].description).toEqual('Second task');
});

test('Should sort tasks by completed', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=completed:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].completed).toEqual(true);
});

test('Should sort tasks by createdAt', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=createdAt:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].description).toEqual('Second task');
});

test('Should fetch page of tasks', async () => {
  const response = await request(app)
    .get('/tasks?limit=1')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
});

test('Should upload task image', async () => {
  await request(app)
    .post(`/tasks/${taskOne._id}/image`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('image', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  const task = await Task.findById(taskOne._id);
  expect(task.image).toEqual(expect.any(Buffer));
});