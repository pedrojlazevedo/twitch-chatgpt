// Import tmi.js module
import tmi from 'tmi.js';
import OpenAI from 'openai';
import { promises as fsPromises } from 'fs';

export class TwitchBot {
    constructor(bot_username, oauth_token, channels) {
        this.channels = channels;
        this.client = new tmi.client({
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: bot_username,
                password: oauth_token
            },
            channels: this.channels
        });
        this.openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    }

    addChannel(channel) {
        // Check if channel is already in the list
        if (!this.channels.includes(channel)) {
            this.channels.push(channel);
            // Use join method to join a channel instead of modifying the channels property directly
            this.client.join(channel);
        }
    }

    connect() {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the connection to be established
                await this.client.connect();
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    disconnect() {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the connection to be closed
                await this.client.disconnect();
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    onMessage(callback) {
        this.client.on('message', callback);
    }

    onConnected(callback) {
        this.client.on('connected', callback);
    }

    onDisconnected(callback) {
        this.client.on('disconnected', callback);
    }

    say(channel, message) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the message to be sent
                await this.client.say(channel, message);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    async sayTTS(channel, text, userstate) {
        try {
            // Make a call to the OpenAI TTS model
            const mp3 = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: 'alloy',
                input: text,
            });

            // Convert the mp3 to a buffer
            const buffer = Buffer.from(await mp3.arrayBuffer());

            // Save the buffer as an MP3 file
            const filePath = './public/file.mp3';
            await fsPromises.writeFile(filePath, buffer);

            // Return the path of the saved audio file
            return filePath;
        } catch (error) {
            console.error('Error in sayTTS:', error);
        }
    }

    whisper(username, message) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the message to be sent
                await this.client.whisper(username, message);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    ban(channel, username, reason) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the user to be banned
                await this.client.ban(channel, username, reason);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    unban(channel, username) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the user to be unbanned
                await this.client.unban(channel, username);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    clear(channel) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the chat to be cleared
                await this.client.clear(channel);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    color(channel, color) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the color to be changed
                await this.client.color(channel, color);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }

    commercial(channel, seconds) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                // Await for the commercial to be played
                await this.client.commercial(channel, seconds);
            } catch (error) {
                // Handle any errors that may occur
                console.error(error);
            }
        })();
    }
}