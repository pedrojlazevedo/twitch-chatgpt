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

    request.get({
        url: "https://aoe4world.com/api/v0/players/search?query=" + player_name ,
        json: true
    }, (error, response) => {
        if (error) {
            return res.send("Error Message");
        }

        let answer = 'Player: ' + player_name
        if (response.players.length === 0) {
            res.send('No player with the name - ' + player_name + ' - was found.')
        }
        if (response.players[0].leaderboards.rm_solo) {
            answer = answer + '\n' + '[Solo] - ' +
                response.players[0].leaderboards.rm_solo.rank_level + ' - '
                response.players[0].leaderboards.rm_solo.rating
        } else {
            answer = answer + '\n' + '[Solo] - Unranked'
        }
        if (response.players[0].leaderboards.rm_team) {
            answer = answer + '\n' + '[Team] - ' +
                response.players[0].leaderboards.rm_team.rank_level + ' - ' +
                response.players[0].leaderboards.rm_team.rating
        } else {
            answer = answer + '\n' + '[Team] - Unranked'
        }
        res.send(answer)
    })
})

app.listen(process.env.PORT || 3000)
