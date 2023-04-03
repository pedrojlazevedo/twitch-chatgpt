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
const messages = [
        {role: "system", content: ""}
];

let file_context = ""
fs.readFile("./file_context.txt", 'utf8', function(err, data) {
  if (err) throw err;
  console.log("Reading context file and adding it as system level message for the agent.")
  messages[0].content = data;
});

app.get('/gpt/:text', async (req, res) => {
    
    //text should recieve Username:Message for the agent to identify conversations with different users in his history. 
    const text = req.params.text
    
    const { Configuration, OpenAIApi } = require("openai");
    console.log("OpenAI API Key:" + process.env.OPENAI_API_KEY)
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      message_history_length: process.env.HISTORY_LENGTH,
    });
    
    const openai = new OpenAIApi(configuration);      
    
    //Add user message to  messages
    messages.push({role: "user", content: text})
    
    //Check if message history is exceeded
    if(messages.length > configuration.message_history_length * 2 + 1) {
        console.log('Message amount in history exceeded. Removing oldest user and agent messages.')
        messages.splice(1,2)
    }
    
    console.dir("Messages: " + JSON.stringify(messages))
    console.log("User Input: " + text)
    
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
        console.log ("Agent answer: " + response.data.choices[0].message.content)
        messages.push({role: "assistant", content: response.data.choices[0].message.content})
        res.send(response.data.choices[0].message.content)
    } else {
        res.send("Something went wrong. Try again later!")
    }
})

app.listen(process.env.PORT || 3000)
