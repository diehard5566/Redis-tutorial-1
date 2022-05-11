const express = require('express')
const app = express()
const fetch = require('node-fetch')
const redis = require('redis')

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)

client.connect()

//Set response

const setResponse = (username, repos) => {
    return `<h2>${username} has ${repos} GitHub repos</h2>`
}

//Make request to GitHub for data
const getRepos = async (req, res, next) => {
    try {
        console.log('Fetching Data...')

        const { username } = req.params

        const response = await fetch(`https://api.github.com/users/${username}`)

        const data = await response.json()

        const repos = data.public_repos.toString()

        console.log(repos)

        // Set data to Redis
        client.setEx(username, 3600, repos)

        res.send(setResponse(username, repos))
    } catch (err) {
        console.error(err)
    }
}

//Cached middleware
const cache = async (req, res, next) => {
    const { username } = req.params

    const data = await client.get(username)
    if (data !== null) {
        res.send(setResponse(username, data))
    } else {
        next()
    }
}

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, function () {
    console.log(`Server for project redis-intro live at port ${PORT}`)
})
