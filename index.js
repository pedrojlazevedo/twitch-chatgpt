import express from 'express';
import fs from 'fs';
import ws from 'ws';

import expressWs from 'express-ws';

import {job} from './keep_alive.js';

import {OpenAIOperations} from './openai_operations.js';
import {TwitchBot} from './twitch_bot.js';

// start keep alive cron job
job.start();
console.log(process.env);

// setup express app
const app = express();
const expressWsInstance = expressWs(app);

// set the view engine to ejs
app.set('view engine', 'ejs');

// load env variables
const GPT_MODE = process.env.GPT_MODE || "CHAT"; // CHAT or PROMPT
const HISTORY_LENGTH = process.env.HISTORY_LENGTH || 5; // number of messages to keep in history
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // openai api key
const MODEL_NAME = process.env.MODEL_NAME || "gpt-3.5-turbo"; // openai model name (e.g. gpt-3, gpt-3.5-turbo, gpt-4)
const TWITCH_USER = process.env.TWITCH_USER; // twitch bot username
const TWITCH_AUTH = process.env.TWITCH_AUTH; // tmi auth token
const COMMAND_NAME = (process.env.COMMAND_NAME || "!gpt").split(",").map(x => x.toLowerCase()); // commands to trigger bot (e.g. !gpt, !chat)
const CHANNELS = (process.env.CHANNELS || "kayotic_animal").split(","); // channels to join
const SEND_USERNAME = process.env.SEND_USERNAME || "true"; // send username in message to openai
const ENABLE_TTS = process.env.ENABLE_TTS || "false"; // enable text to speech
const ENABLE_CHANNEL_POINTS = process.env.ENABLE_CHANNEL_POINTS || "false"; // enable channel points

if (!OPENAI_API_KEY) {
    console.error("No OPENAI_API_KEY found. Please set it as environment variable.");
}
if (!TWITCH_USER) {
    console.error("No TWITCH_USER found. Please set it as environment variable.");
}
if (!TWITCH_AUTH) {
    console.error("No TWITCH_AUTH found. Please set it as environment variable.");
}

// init global variables
const MAX_LENGTH = 399;
let file_context = "You are a helpful Twitch Chatbot.";

// setup twitch bot
console.log("Channels: " + CHANNELS);

const bot = new TwitchBot(TWITCH_USER, TWITCH_AUTH, CHANNELS, OPENAI_API_KEY, ENABLE_TTS);

// setup openai operations
file_context = fs.readFileSync("./file_context.txt", 'utf8');
const openai_ops = new OpenAIOperations(file_context, OPENAI_API_KEY, MODEL_NAME, HISTORY_LENGTH);

// setup twitch bot callbacks
bot.onConnected((addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
    CHANNELS.forEach(channel => {
        console.log(`* Joining ${channel}`);
        bot.say(channel, `Sup all ${channel}! I'm ${TWITCH_USER}, here to exist!`);
    });
});

bot.onDisconnected(reason => {
    console.log(`Disconnected: ${reason}`);
});

// connect bot
bot.connect(
    () => {
        console.log("Bot connected!");
    },
    error => {
        console.log("Bot couldn't connect!");
        console.log(error);
    }
);

bot.onMessage(async (channel, user, message, self) => {
    if (self) return;

    if (ENABLE_CHANNEL_POINTS) {
        console.log(`The message id is ${user["msg-id"]}`);
        if (user["msg-id"] === "highlighted-message") {
            console.log(`The message is ${message}`);
            const response = await openai_ops.make_openai_call(message);
            bot.say(channel, response);
        }
    }

    if (COMMAND_NAME.some(command => message.toLowerCase().startsWith(command))) {
        let text = message.slice(COMMAND_NAME.length);

        if (SEND_USERNAME === "true") {
            text = `Message from user ${user.username}: ${text}`;
        }

        // make openai call
        const response = await openai_ops.make_openai_call(text);

        // split response if it exceeds twitch chat message length limit
        // send multiple messages with a delay in between
        if (response.length > MAX_LENGTH) {
            const messages = response.match(new RegExp(`.{1,${MAX_LENGTH}}`, "g"));
            messages.forEach((message, index) => {
                setTimeout(() => {
                    bot.say(channel, message);
                }, 1000 * index);
            });
        } else {
            bot.say(channel, response);
        }

        if (ENABLE_TTS === "true") {
            try {
                console.log(`${user.username} - ${user.userstate}`);
                const ttsAudioUrl = await bot.sayTTS(channel, response, user.userstate);
                notifyFileChange(ttsAudioUrl);
            } catch (error) {
                console.error(error);
            }
        }
    }
});

app.ws('/check-for-updates', (ws, req) => {
    ws.on('message', message => {
        // Handle WebSocket messages (if needed)
    });
});

// setup bot
const messages = [
    { role: "system", content: "You are a helpful Twitch Chatbot." }
];

console.log("GPT_MODE is " + GPT_MODE);
console.log("History length is " + HISTORY_LENGTH);
console.log("OpenAI API Key:" + OPENAI_API_KEY);
console.log("Model Name:" + MODEL_NAME);

app.use(express.json({ extended: true, limit: '1mb' }));
app.use('/public', express.static('public'));

app.all('/', (req, res) => {
    console.log("Just got a request!");
    res.render('pages/index');
});

if (GPT_MODE === "CHAT") {
    fs.readFile("./file_context.txt", 'utf8', (err, data) => {
        if (err) throw err;
        console.log("Reading context file and adding it as system level message for the agent.");
        messages[0].content = data;
    });
} else {
    fs.readFile("./file_context.txt", 'utf8', (err, data) => {
        if (err) throw err;
        console.log("Reading context file and adding it in front of user prompts:");
        file_context = data;
        console.log(file_context);
    });
}

app.get('/gpt/:text', async (req, res) => {
    const text = req.params.text;

    const answer_question = async (answer) => {
        if (answer.length > MAX_LENGTH) {
            const messages = answer.match(new RegExp(`.{1,${MAX_LENGTH}}`, "g"));
            messages.forEach((message, index) => {
                setTimeout(() => {
                    bot.say(channel, message);
                }, 1000 * index);
            });
        } else {
            bot.say(channel, answer);
        }
    };

    let answer = "";
    if (GPT_MODE === "CHAT") {
        answer = await openai_ops.make_openai_call(text);
    } else if (GPT_MODE === "PROMPT") {
        let prompt = file_context;
        prompt += `\n\nUser: ${text}\nAgent:`;
        answer = await openai_ops.make_openai_call_completion(prompt);
    } else {
        console.log("ERROR: GPT_MODE is not set to CHAT or PROMPT. Please set it as environment variable.");
    }

    await answer_question(answer);

    res.send(answer);
});

const server = app.listen(3000, () => {
    console.log('Server running on port 3000');
});

const wss = expressWsInstance.getWss();

wss.on('connection', ws => {
    ws.on('message', message => {
        // Handle client messages (if needed)
    });
});

function notifyFileChange() {
    wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ updated: true }));
        }
    });
}
