const express = require('express')
const request = require('request')
const app = express()
const fs = require('fs');
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

// load env variables
let GPT_MODE = process.env.GPT_MODE
let HISTORY_LENGTH = process.env.HISTORY_LENGTH
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
let MODEL_NAME = process.env.MODEL_NAME

if (!GPT_MODE) {
    GPT_MODE = "CHAT"
}
if (!HISTORY_LENGTH) {
    HISTORY_LENGTH = 5
}
if (!OPENAI_API_KEY) {
    console.log("No OPENAI_API_KEY found. Please set it as environment variable.")
}
if (!MODEL_NAME) {
    MODEL_NAME = "gpt-3.5-turbo"
}

// init global variables
const MAX_LENGTH = 399
let file_context = "You are a helpful Twitch Chatbot."
let last_user_message = ""

const messages = [
    {role: "system", content: "You are a helpful Twitch Chatbot."}
];

console.log("GPT_MODE is " + GPT_MODE)
console.log("History length is " + HISTORY_LENGTH)
console.log("OpenAI API Key:" + OPENAI_API_KEY)
console.log("Model Name:" + MODEL_NAME)

app.use(express.json({extended: true, limit: '1mb'}))

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

if (process.env.GPT_MODE === "CHAT"){

    fs.readFile("./file_context.txt", 'utf8', function(err, data) {
        if (err) throw err;
        console.log("Reading context file and adding it as system level message for the agent.")
        messages[0].content = data;
    });

} else {

    fs.readFile("./file_context.txt", 'utf8', function(err, data) {
        if (err) throw err;
        console.log("Reading context file and adding it in front of user prompts:")
        file_context = data;
        console.log(file_context);
    });

}

app.get('/gpt/:text', async (req, res) => {

    //The agent should recieve Username:Message in the text to identify conversations with different users in his history. 

    const text = req.params.text
    const { Configuration, OpenAIApi } = require("openai");

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    if (GPT_MODE === "CHAT"){
        //CHAT MODE EXECUTION

        //Add user message to  messages
        messages.push({role: "user", content: text})
        //Check if message history is exceeded
        console.log("Conversations in History: " + ((messages.length / 2) -1) + "/" + process.env.HISTORY_LENGTH)
        if(messages.length > ((process.env.HISTORY_LENGTH * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and agent messages.')
            messages.splice(1,2)
        }

        console.log("Messages: ")
        console.dir(messages)
        console.log("User Input: " + text)

        const response = await openai.createChatCompletion({
            model: MODEL_NAME,
            messages: messages,
            temperature: 0.7,
            max_tokens: 256,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        if (response.data.choices) {
            let agent_response = response.data.choices[0].message.content

            console.log ("Agent answer: " + agent_response)
            messages.push({role: "assistant", content: agent_response})

            //Check for Twitch max. chat message length limit and slice if needed
            let sliced_agent_response = ""
            if(agent_response.length > MAX_LENGTH){
                console.log("Agent answer exceeds twitch chat limit. Slicing to first 399 characters.")
                sliced_agent_response = agent_response.slice(0, MAX_LENGTH)
                // save the other part of the message for the next response
                last_user_message = agent_response.slice(MAX_LENGTH)
                console.log ("Sliced Agent answer: " + agent_response)
            } else {
                sliced_agent_response = agent_response
            }
            res.send(sliced_agent_response)
        } else {
            res.send("Something went wrong. Try again later!")
        }

    } else {
        //PROMPT MODE EXECUTION
        const prompt = file_context + "\n\nQ:" + text + "\nA:";
        console.log("User Input: " + text)

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 256,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        if (response.data.choices) {
            let agent_response = response.data.choices[0].text
            console.log ("Agent answer: " + agent_response)

            //Check for Twitch max. chat message length limit and slice if needed
            let sliced_agent_response = ""
            if(agent_response.length > MAX_LENGTH){
                console.log("Agent answer exceeds twitch chat limit. Slicing to first 399 characters.")
                sliced_agent_response = agent_response.slice(0, MAX_LENGTH)
                // save the other part of the message for the next response
                last_user_message = agent_response.slice(MAX_LENGTH)
                console.log ("Sliced Agent answer: " + agent_response)
            } else {
                sliced_agent_response = agent_response
            }
            res.send(sliced_agent_response)
        } else {
            res.send("Something went wrong. Try again later!")
        }
    }

})

app.all('/continue/', (req, res) => {
    console.log(last_user_message)
    console.log("Just got a continue request!")
    // Return the rest of the sliced answer from the last request
    if (last_user_message.length > 0) {
        let new_user_message = last_user_message
        if (last_user_message.length > MAX_LENGTH){
            console.log("Agent answer exceeds twitch chat limit. Slicing to first 399 characters.")
            new_user_message = last_user_message.slice(0, MAX_LENGTH)
        }
        // save the other part of the message for the next response
        last_user_message = last_user_message.slice(MAX_LENGTH)
        console.log ("Sliced Agent answer: " + last_user_message)
        res.send(new_user_message)
    }
    else {
        res.send("No message to continue. Please send a new message first.")
    }
})

app.listen(process.env.PORT || 3000)
