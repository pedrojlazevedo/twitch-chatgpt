const express = require('express')
const request = require('request')
const app = express()

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

app.all('/rank', (req, res) => {
    console.log("Test")
    res.send("Perfect <3")
})

app.get('/rank/:name', (req, res) => {
    const player_name = req.params.name
    const res = $(urlfetch json "https://aoe4world.com/api/v0/players/search?query=$(querystring)");
    request.get({
        url: "https://aoe4world.com/api/v0/players/search?query=" + player_name ,
        json: true
    }, (error, response) => {
        if (error) {
            return res.send("Error Message");
        }
        res.send(response);
    })
    

})

app.listen(process.env.PORT || 3000)
