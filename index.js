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

app.get('/rank/:name', (req, res) => {
    res.send('user:' + req.params.name);    
    //const res = $(urlfetch json "https://aoe4world.com/api/v0/players/search?query=$(querystring)");
    //if (res.players.length===0){const res = $(urlfetch json "https://aoe4world.com/api/v0/players/search?query=GT_Mjerticla";
    //    `${res.players[0].name} - [Solo] ${res.players[0].leaderboards.rm_solo.rank_level} - ${res.players[0].leaderboards.rm_solo.rating}`}
    //else if (res.players[0].leaderboards.rm_solo) {`${res.players[0].name} - [Solo] ${res.players[0].leaderboards.rm_solo.rank_level} - ${res.players[0].leaderboards.rm_solo.rating}`}
    //else if (res.players[0].leaderboards.rm_team) {`${res.players[0].name} - [Team] ${res.players[0].leaderboards.rm_team.rank_level} - ${res.players[0].leaderboards.rm_team.rating}`}
    //else {`There is no information about player ${res.players[0].name}`}
    //)
})

app.listen(process.env.PORT || 3000)
