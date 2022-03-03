// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for stats
const Stats = require('../models/stats')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { stats: { title: '', text: 'foo' } } -> { stats: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /stats
router.get('/stats', requireToken, (req, res, next) => {
  Stats.find()
    // respond with status 200 and JSON of the stats
    .then(stats => res.status(200).json({ stats: stats }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /stats/5a7db6c74d55bc51bdf39793
router.get('/stats/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Stats.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "stats" JSON
    .then(stats => res.status(200).json({ stats: stats }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /stats
router.post('/stats', requireToken, (req, res, next) => {
  // set owner of new stats to be current user
  req.body.stats.owner = req.user.id

  Stats.create(req.body.stats)
    // respond to succesful `create` with status 201 and JSON of new "stats"
    .then(stats => {
      res.status(201).json({ stats })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /stats/5a7db6c74d55bc51bdf39793
router.patch('/stats/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.stats.owner

  Stats.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the stats's owner (stats.owner)
    .then(stats => requireOwnership(req, stats))
    // updating stats object with exampleData
    .then(stats => stats.updateOne(req.body.stats))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /stats/5a7db6c74d55bc51bdf39793
router.delete('/stats/:id', requireToken, (req, res, next) => {
  Stats.findById(req.params.id)
    .then(handle404)
  // ensure the signed in user (req.user.id) is the same as the stats's owner (stats.owner)
    .then(stats => requireOwnership(req, stats))
    // delete stats from mongodb
    .then(stats => stats.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
