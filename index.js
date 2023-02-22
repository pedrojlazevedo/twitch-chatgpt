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

app.listen(process.env.PORT || 3000)
