const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll(async () => {
  await mongoose.disconnect();
});

test('Should sign up a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'As',
    email: 'assssss@gmail.com',
    password: 'mypass77777'
  }).expect(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'As',
      email: 'assssss@gmail.com'
    },
    token: user.tokens[0].token
  });
  expect(user.password).not.toBe('mypass77777');
});

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
  await request(app).post('/users/login').send({
    email: 'steven@gmail.com',
    password: 'stevenson123'
  }).expect(400);
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthorized user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Andrew'
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Andrew');
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Vilnius'
    })
    .expect(400);
});

test('Should not signup user with invalid name', async () => {
  await request(app)
    .post('/users')
    .send({
      name: '',
      email: '123@gmail.com',
      password: 'sebastian999999'
    })
    .expect(400);
});

test('Should not signup user with invalid email', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'sebastian',
      email: '123gmail.com',
      password: 'sebastian999999'
    })
    .expect(400);
});

test('Should not signup user with invalid password', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'sebastian',
      email: '123@gmail.com',
      password: 'password'
    })
    .expect(400);
});

test('Should not update user if unauthenticated', async () => {
  await request(app)
    .patch('/users/me')
    .send({
      name: 'Johny'
    })
    .expect(401);
});

test('Should not update user with invalid name', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: ''
    })
    .expect(400);
});

test('Should not update user with invalid email', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      email: '123gmail.com'
    })
    .expect(400);
});

test('Should not update user with invalid password', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      password: 'password'
    })
    .expect(400);
});