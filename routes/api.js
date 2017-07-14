var firebase = require('firebase-admin');
var express = require('express');
var async = require('async');
var _ = require('lodash');

var router = express.Router();
var db = firebase.database();
const MAX_WORKERS = 4;

router.delete('/users/:uid', function(req, res, next) {
  firebase.auth().deleteUser(req.params.uid)
    .then(function() {
      res.json({ message: "success", error: error });
    })
    .catch(function(error) {
      res.json({ message: "error", error: error });
    });
});

router.delete('/users/auth/db', function(req, res, next) {
  db.ref('/users').once('value').then(users => {
    users = _.values(_.mapValues(users.val(), (value, key) => { value['id'] = key; return { id: value['id'] }; }));
    var q = async.queue(function(key, cb) {
      firebase.auth().deleteUser(key)
        .then(function() {
          db.ref('/users/' + key).remove().then(() => {
            console.log("Success : ", key);
            cb();
          });
        })
        .catch(function(error) {
          console.log(error.code, " : ", key);
          if (error.code === "auth/user-not-found") {
            db.ref('/users/' + key).remove().then(() => {
              cb();
            });
          } else cb();
        });
    }, MAX_WORKERS);

    q.drain = function() {
      console.log('all users have been processed');
    }

    users.forEach(val => {
      q.push(val.localId);
    });
  });

  res.json({ message: "start queues" });
});

router.delete('/users/auth/export', function(req, res, next) {
  var users = require('../firebase/users.json').users;
  var q = async.queue(function(key, cb) {
    firebase.auth().deleteUser(key)
      .then(function() {
        cb();
      })
      .catch(function(error) {
        console.log("Error : ", error.code);
        if (error.code === "auth/user-not-found") {
          db.ref('/users/' + key).remove().then(() => {
            console.log("Error : ", key);
            cb();
          });
        } else cb();
      });
  }, MAX_WORKERS);

  q.drain = function() {
    console.log('all users have been processed');
  }

  users.forEach(val => {
    q.push(val.localId);
  });

  res.json({ message: "start queues" });
});

module.exports = router;