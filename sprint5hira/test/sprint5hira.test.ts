import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as sprint5hira from '../lib/sprint5hira-stack'

const request = require('supertest');
const assert = require('assert');
const express = require('express');
const app = require('../server/server.js');

// example test. To run these tests, uncomment this file along with the
// example resource in lib/sprint5hira-stack.ts


test('AWS Lambda', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new sprint5hira.Sprint5HiraStack(app, 'MyTestStack');
    // THEN
    const template = cdk.assertions.Template.fromStack(stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });

  // Test cases for get function
  describe('GET', function() {
    it('Get reqiest recieved and responds with json', function(done) {
      request(app)
        .get('/')
        .send()
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });

  // Test cases for post function
  describe('POST', function() {
    it('POST reqiest recieved and responds with json', function(done) {
      request(app)
        .post('/')
        .send({"url":"www.gmail.com"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });

  // Test case for update function
  describe('Update', function() {
    it('Update reqiest recieved and responds with json', function(done) {
      request(app)
        .post('/')
        .send({"url":"www.gmail.com",
                "updateurl":"www.dropbox.com"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });

  // Test case for delete function
  describe('Delete', function() {
    it('Delete reqiest recieved and responds with json', function(done) {
      request(app)
        .post('/')
        .send({"url":"www.youtube.com"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });

  // Content-Type: application/json