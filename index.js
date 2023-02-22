const express = require('express')
const app = express()

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

app.all('/rank', (req, res) => {
    console.log("Test")
    res.send("Perfect <3")
})

app.get('/rank', (req, res) => {
    console.log(req.query)
    const name = req.query.name
    res.send('name: ' + req.query.name)
})

app.listen(process.env.PORT || 3000)
