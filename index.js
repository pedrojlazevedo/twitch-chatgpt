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

const messages = [
        {role: "system", content: file_context}
];


app.get('/gpt/:text', async (req, res) => {
    const text = req.params.text
    const { Configuration, OpenAIApi } = require("openai");

    console.log(process.env.OPENAI_API_KEY)
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);      
   
    //{role: "user", content: ""}
    //{role: "assistant", content: ""}
    
    messages.push({role: "user", content: text})
   
    // Chat History
    //chat_history.push(text + "\n")
    //if (chat_history.length > 10) {
    //    chat_history.shift()
    //}
    //console.log(chat_history)
    //const prompt = file_context + "\n\nQ:" + text + "\nA:";
    
    
    console.log(messages);
    
    const response = await openai.createChatCompletion({
      model: "text-davinci-003",
      messages: messages,
      temperature: 0.5,
      max_tokens: 128,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    if (response.data.choices) {
        messages.push({role: "assistant", content: response.data.choices[0].content})
        console.log(messages);
        res.send(response.data.choices[0].content)
    } else {
        res.send("Something went wrong. Try again later!")
    }
})

app.listen(process.env.PORT || 3000)
