import express from 'express';
import fs from 'fs';
import {OpenAIOperations} from './openai_operations.js';
import {TwitchBot} from './twitch_bot.js';
import {job} from './keep_alive.js';
import expressWs from 'express-ws';
import ws from 'ws';

// start keep alive cron job
job.start();
console.log(process.env)

// setup express app
const app = express();
const expressWsInstance = expressWs(app);

// set the view engine to ejs
app.set('view engine', 'ejs');

// load env variables
let GPT_MODE = process.env.GPT_MODE
let HISTORY_LENGTH = process.env.HISTORY_LENGTH
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
let MODEL_NAME = process.env.MODEL_NAME
let TWITCH_USER = process.env.TWITCH_USER
let TWITCH_AUTH =  process.env.TWITCH_AUTH
let COMMAND_NAME = process.env.COMMAND_NAME
let CHANNELS = process.env.CHANNELS
let SEND_USERNAME = process.env.SEND_USERNAME

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
if (!TWITCH_USER) {
    TWITCH_USER = "oSetinhasBot"
    console.log("No TWITCH_USER found. Using oSetinhasBot as default.")
}
if (!TWITCH_AUTH) {
    // https://dev.twitch.tv/console
    // https://twitchapps.com/tmi/
    TWITCH_AUTH = "oauth:vgvx55j6qzz1lkt3cwggxki1lv53c2"
    console.log("No TWITCH_AUTH found. Using oSetinhasBot auth as default.")
}
if (!COMMAND_NAME) {
    COMMAND_NAME = "chat"
}
if (!CHANNELS) {
    CHANNELS = ["oSetinhas", "jones88"]
} else {
    // split channels by comma into array
    CHANNELS = CHANNELS.split(",")
}
if (!SEND_USERNAME) {
    SEND_USERNAME = true
}

// init global variables
const MAX_LENGTH = 399
let file_context = "You are a helpful Twitch Chatbot."
let last_user_message = ""

// setup twitch bot
const channels = CHANNELS;
const channel = channels[0];
console.log("Channels: " + channels)

const bot = new TwitchBot(TWITCH_USER, TWITCH_AUTH, channels);

// setup openai operations
file_context = fs.readFileSync("./file_context.txt", 'utf8');
const openai_ops = new OpenAIOperations(file_context, OPENAI_API_KEY, MODEL_NAME, HISTORY_LENGTH);

// setup twitch bot callbacks
bot.onConnected((addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);

    // join channels
    channels.forEach(channel => {
        console.log(`* Joining ${channel}`);
        console.log(`* Saying hello in ${channel}`)
    });
});

bot.onDisconnected((reason) => {
    console.log(`Disconnected: ${reason}`);
});

// connect bot
bot.connect(
    () => {
        console.log("Bot connected!");
    },
    (error) => {
        console.log("Bot couldn't connect!");
        console.log(error);
    }
);

bot.onMessage(async (channel, user, message, self) => {
    if (self) return;

    // check if message is a command started with !COMMAND_NAME (e.g. !gpt)
    if (message.startsWith(COMMAND_NAME)) {
        // get text
        // text from user ...
        let text = message.slice(COMMAND_NAME.length);

        if (SEND_USERNAME) {
            text = user.username + ": " + text
        }

        // make openai call
        const response = await openai_ops.make_openai_call(text);

        // split response if it exceeds twitch chat message length limit
        // send multiples messages with a delay in between
        if (response.length > MAX_LENGTH) {
            const messages = response.match(new RegExp(`.{1,${MAX_LENGTH}}`, "g"));
            messages.forEach((message, index) => {
                setTimeout(() => {
                    bot.say(channel, message);
                }, 1000 * index);
            });
        } else {
            bot.say(channel, response);
            try {
                console.log(user.username + ' - ' + user.userstate);
                const ttsAudioUrl = await bot.sayTTS(channel, response, user.userstate);
                // Notify clients about the file change
                notifyFileChange(ttsAudioUrl);
            } catch (error) {
                console.error(error);
            }
        }
    }
});

app.ws('/check-for-updates', (ws, req) => {
  ws.on('message', (message) => {
    // Handle WebSocket messages (if needed)
  });
});

// setup bot
const messages = [
    {role: "system", content: "You are a helpful Twitch Chatbot."}
];

console.log("GPT_MODE is " + GPT_MODE)
console.log("History length is " + HISTORY_LENGTH)
console.log("OpenAI API Key:" + OPENAI_API_KEY)
console.log("Model Name:" + MODEL_NAME)

app.use(express.json({extended: true, limit: '1mb'}))
app.use('/public', express.static('public'))

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.render('pages/index');
    //res.sendFile(process.env.RENDER_SRC_ROOT + '/index.ejs')
    //res.send('Yo!')
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

    //The agent should receive Username:Message in the text to identify conversations with different users in his history.
    const text = req.params.text

    // define function to check history length and perform bot response
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
    }

    let answer = ""
    if (GPT_MODE === "CHAT") {
        //CHAT MODE EXECUTION
        answer = await openai_ops.make_openai_call(text);
    } else if(GPT_MODE === "PROMPT") {
        //PROMPT MODE EXECUTION

        // create prompt based on file_context and the user prompt
        let prompt = file_context;
        prompt += "\n\nUser: " + text + "\nAgent:"
        answer = await openai_ops.make_openai_call_completion(prompt);
    } else {
        //ERROR MODE EXECUTION
        console.log("ERROR: GPT_MODE is not set to CHAT or PROMPT. Please set it as environment variable.")
    }

    // send response
    await answer_question(answer)

    res.send(answer)
})

// make app always listening to twitch chat and get new messages starting with !gpt on port 3000
const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

const wss = expressWsInstance.getWss();
// const wss = appWithWebSocket.ws

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Handle client messages (if needed)
    });
});

// Notify clients when the file changes
function notifyFileChange() {
    wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ updated: true }));
        }
    });
}
