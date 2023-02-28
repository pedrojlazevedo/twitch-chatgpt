const express = require('express')
const request = require('request')
const app = express()

const mjerticla_id = 6600634

const civ_mapping = {
    'holy_roman_empire': 'HRE',
    'rus': 'RUS',
    'mongols': 'Mongol',
    'chinese': 'China',
    'delhi_sultanate': 'Delhi',
    'english': 'ENG',
    'ottomans': 'Otto',
    'abbasid_dynasty': 'Abba',
    'french': 'FR',
    'malians': 'Malian'
}

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
        let body = response.body
        if (error) {
            return res.send("Something went wrong! HEEEEELP");
        }

        let answer = 'Player: ' + body.players[0].name + " <-> "

        if (body.players.length === 0) {
            res.send('No player with the name - ' + player_name + ' - was found.')
        }
        if (body.players[0].leaderboards.rm_solo) {
            answer = answer + '\n' + '[Solo] - ' +
                body.players[0].leaderboards.rm_solo.rank_level + ' - ' +
                body.players[0].leaderboards.rm_solo.rating + ' <-> '
        } else {
            answer = answer + '\n' + '[Solo] - Unranked <-> '
        }
        if (body.players[0].leaderboards.rm_team) {
            answer = answer + '\n' + '[Team] - ' +
                body.players[0].leaderboards.rm_team.rank_level + ' - ' +
                body.players[0].leaderboards.rm_team.rating
        } else {
            answer = answer + '\n' + '[Team] - Unranked'
        }
        res.send(answer)
    })
})

app.all('/match', (req, res) => {
    request.get({
        url: "https://aoe4world.com/api/v0/players/" + String(mjerticla_id) + "/games",
        json: true
    }, (error, response) => {
        let body = response.body
        if (error) {
            return res.send("Something went wrong! HEEEEELP");
        }
        let last_game = body.games[0]  // get last game
        if (last_game.ongoing) {
            let answer = "["
            answer = answer + last_game.server + "]"
            answer = answer + " <-> " + last_game.map
            const teams = last_game.teams
            for (let i = 0; i < teams.length; i++) {
                if (i == 0) {
                    answer = answer + " <-> ["
                } else {
                    answer = answer + " VS ["
                }
                for (let j = 0; j < teams[i].length; j++) {
                    const player = teams[i][j].player
                    const player_civ_name = "(" + civ_mapping[player.civilization] + ")" + player.name 
                    if (j == 0) {
                        answer = answer + player_civ_name
                    } else {
                        answer = answer + " + " + player_civ_name
                    }
                    if (player.rating) {
                        answer = answer + "(" + player.rating + ")"
                    }
                }
                answer = answer + "]"
            }
            res.send(answer)
        } else {
            res.send("O teu streamer favorito não está a jogar nenhum jogo :(")
        }
    })
})

app.get('/match/:name', (req, res) => {
    const player_name = req.params.name
    console.log(player_name)
    let player_id = 0

    // get user id
    request.get({
        url: "https://aoe4world.com/api/v0/players/search?query=" + player_name,
        json: true
    }, (error, response) => {
        console.log(response)
        let body = response.body
        if (error) {
            return res.send("Não encontrei o nome desse jogador");
        }
        console.log("--body--")
        console.log(body.players[0])
        player_id = body.players[0].profile_id

            console.log(player_id === 0)
        console.log(player_id)
        if (player_id === 0) {
            res.send("Não encontrei o nome desse jogador.")
        }
        request.get({
            url: "https://aoe4world.com/api/v0/players/" + String(player_id) + "/games",
            json: true
        }, (error, response) => {
            let body = response.body
            if (error) {
                return res.send("Something went wrong! HEEEEELP");
            }
            let last_game = body.games[0]  // get last game
            if (last_game.ongoing) {
                let answer = "["
                answer = answer + last_game.server + "]"
                answer = answer + " <-> " + last_game.map
                const teams = last_game.teams
                for (let i = 0; i < teams.length; i++) {
                    if (i === 0) {
                        answer = answer + " <-> ["
                    } else {
                        answer = answer + " VS ["
                    }
                    for (let j = 0; j < teams[i].length; j++) {
                        const player = teams[i][j].player
                        const player_civ_name = "(" + civ_mapping[player.civilization] + ")" + player.name
                        if (j === 0) {
                            answer = answer + player_civ_name
                        } else {
                            answer = answer + " + " + player_civ_name
                        }
                        if (player.rating) {
                            answer = answer + "(" + player.rating + ")"
                        }
                    }
                    answer = answer + "]"
                }
                res.send(answer)
            } else {
                res.send("Esse jogador não está a jogar nenhum jogo... :(")
            }
        })
    })
})


app.listen(process.env.PORT || 3000)
