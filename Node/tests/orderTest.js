// tests/orderTest.js
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { expect } from 'chai';

describe('Order API Tests', () => {
  let authToken;
  let orderId;

  before(async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/auth/signin')
      .send({
        email: 'danafatima26@gmail.com',
        password: '12345678'
      });
    authToken = loginResponse.body.token;
  });

  it('should create a new order', async () => {
    const response = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        details: {
          weight: 5,
          dimensions: "30x20x15",
          contents: "Electronics",
          shippingAddress: "123 Test Street, Algeria",
          codAmount: 5000
        }
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('success', true);
    expect(response.body.data).to.have.property('_id');
    orderId = response.body.data._id;
  });

  it('should get all orders', async () => {
    const response = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('success', true);
    expect(response.body.data).to.be.an('array');
  });

  it('should get a specific order', async () => {
    const response = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).to.equal(200);
    expect(response.body.data._id).to.equal(orderId);
  });

  after(async () => {
    await mongoose.connection.close();
  });
});