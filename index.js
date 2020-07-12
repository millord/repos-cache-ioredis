const express = require('express')
const fetch = require('node-fetch')

const morgan = require('morgan')
const Redis = require("ioredis");
const redis = new Redis({
  port: 6379
}); // uses defaults unless given configuration object


const PORT = process.env.PORT || 5000

const REDIS_PORT = process.env || 6379


// CREATE THE REDIS CLIENT INTANCE 
//const client = redis.createClient(REDIS_PORT)

// CREATING THE APP 
const app = express()


// MIDDLEWARES
app.use(morgan('dev'))


// THE CATCH FUNCTION 
function cache(req, res, next) {
  const { username } = req.params
  redis.get(username, (err, data) => {
    if (err) throw err
    if (data !== null) {
      res.send(setResponse(username, data))
    } else {
      next()
    }
  })
}


// CREATING THE FUNCTION TO DISPLAY THE DATA
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} github repos</h2>`
}

// CREATING FUNCTION TO MAKE THE REQUEST
async function getRepos(req, res, next) {
  try {

    console.log('Fetching data...')
    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`)

    const data = await response.json()

    const repos = data.public_repos;

    // setting to redis
    //redis.set('key', 100, 'ex', 10)
    redis.setex(username, 3600, repos)
    // modidy the response to display the data
    res.send(setResponse(username, repos))

  } catch (err) {
    console.error(err)
    res.status(500)
  }
}

// ADD THE ROUTE
app.get('/repo/:username', cache, getRepos)


// LISTENING 
app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`)
})