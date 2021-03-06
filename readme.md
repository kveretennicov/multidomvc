# AngularJS TodoMVC Example Reloaded

Based on [AngularJS TodoMVC](https://github.com/tastejs/todomvc/tree/master/examples/angularjs)

It extends the original example with the following:
- It allows managing multiple TODO lists instead of just one.
- It adds admin forms (Django + Grappelli).
- It adds API backend (Django REST Framework).
- It versions data changes on the backend (Reversion).
- It supports dockerized end-to-end tests of frontend + backend.

## Testsuite

The app uses [Karma](http://karma-runner.github.io/0.12/index.html) to run the tests located in the `test/` folder. To run the tests:

```
$ npm install
$ npm test
```

To run end-to-end tests involving both backend and frontend:

```
$ docker build --tag multidomvc .
$ docker run -it -p 8000:8000 multidomvc
$ test/e2e/run.sh test/e2e/protractor.conf.js
```
