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

const file_context = "Du bist ein hilfreicher und witziger Chatbot der Community des Twitch Kanals BrotundVideospiele."
fs.readFile("./file_context.txt", 'utf8', function(err, data) {
  if (err) throw err;
  console.log(data);
  console.log("file_context wurde gelesen")
  file_context = data;
});

const messages = [
        {role: "system", content: file_context + "\n"}
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
    
    if(messages.length > 20) {
        messages.shift()
    }
   
    // Chat History
    //chat_history.push(text + "\n")
    //if (chat_history.length > 10) {
    //    chat_history.shift()
    //}
    //console.log(chat_history)
    //const prompt = file_context + "\n\nQ:" + text + "\nA:";
    
    
    console.log(messages);
    
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: 128,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    if (response.data.choices) {
        console.log(response.data.choices)
        messages.push({role: "assistant", content: response.data.choices[0].message.content})
        console.log(messages);
        res.send(response.data.choices[0].message.content)
    } else {
        res.send("Something went wrong. Try again later!")
    }
})

app.listen(process.env.PORT || 3000)
