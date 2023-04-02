const express = require('express')
const request = require('request')
const app = express()
const fs = require('fs');
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

app.use(express.json({extended: true, limit: '1mb'}))


app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

let file_context = ""
fs.readFile("./file_context.txt", 'utf8', function(err, data) {
  if (err) throw err;
  console.log(file_context);
  file_context = data;
});

app.get('/gpt/:text', async (req, res) => {
    const text = req.params.text
    const { Configuration, OpenAIApi } = require("openai");

    console.log(process.env.OPENAI_API_KEY)
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = file_context + "\n\nQ:" + text + "\nA:";
    console.log(prompt);
    
    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      prompt: prompt,
      temperature: 0.5,
      max_tokens: 128,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    if (response.data.choices) {
        res.send(response.data.choices[0].text)
    } else {
        res.send("Something went wrong. Try again later!")
    }
})

app.listen(process.env.PORT || 3000)
