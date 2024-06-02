# ChatGPT Twitch Bot Documentation

**Important Notice: Cyclic is no longer supported for deployment. Please use Render for deploying this bot.**

Your support means the world to me! ❤️

☕ [Buy me a coffee to support me](https://www.buymeacoffee.com/osetinhas) ☕

Join our Discord community:

[https://discord.gg/pcxybrpDx6](https://discord.gg/pcxybrpDx6)

---

## Overview

This is a simple Node.js chatbot with ChatGPT integration, designed to work with Twitch streams. It uses the Express framework and can operate in two modes: chat mode (with context of previous messages) or prompt mode (without context of previous messages).

## Features

- Responds to Twitch chat commands with ChatGPT-generated responses.
- Can operate in chat mode with context or prompt mode without context.
- Supports Text-to-Speech (TTS) for responses.
- Customizable via environment variables.
- Deployed on Render for 24/7 availability.

---

## Setup Instructions

### 1. Fork the Repository

Login to GitHub and fork this repository to get your own copy.

### 2. Fill Out Your Context File

Open `file_context.txt` and write down all your background information for GPT. This content will be included in every request.

### 3. Create an OpenAI Account

Create an account on [OpenAI](https://platform.openai.com) and set up billing limits if necessary.

### 4. Get Your OpenAI API Key

Generate an API key on the [API keys page](https://platform.openai.com/account/api-keys) and store it securely.

### 5. Deploy on Render

Render allows you to run your bot 24/7 for free. Follow these steps:

#### 5.1. Deploy to Render

Click the button below to deploy:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

#### 5.2. Login with GitHub

Log in with your GitHub account and select your forked repository for deployment.

### 6. Set Environment Variables

Go to the variables/environment tab in your Render deployment and set the following variables:

#### 6.1. Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key.

#### 6.2. Optional Variables

##### 6.2.1. Nightbot/Streamelements Integration Variable
- `GPT_MODE`: (default: `CHAT`) Mode of operation, can be `CHAT` or `PROMPT`.

##### 6.2.2. All Modes Variables
- `HISTORY_LENGTH`: (default: `5`) Number of previous messages to include in context.
- `MODEL_NAME`: (default: `gpt-3.5-turbo`) The OpenAI model to use. You can check the available models [here](https://platform.openai.com/docs/models/). 
- `COMMAND_NAME`: (default: `!gpt`) The command that triggers the bot. You can set more than one command by separating them with a comma (e.g. `!gpt,!chatbot`).
- `CHANNELS`: List of Twitch channels the bot will join (comma-separated). (e.g. `channel1,channel2`; do not include www.twitch.tv)
- `SEND_USERNAME`: (default: `true`) Whether to include the username in the message sent to OpenAI.
- `ENABLE_TTS`: (default: `false`) Whether to enable Text-to-Speech.
- `ENABLE_CHANNEL_POINTS`: (default: `false`) Whether to enable channel points integration.
- `COOLDOWN_DURATION`: (default: `10`) Cooldown duration in seconds between responses.

#### 6.3. Twitch Integration Variables

- `TWITCH_AUTH`: OAuth token for your Twitch bot.
  - Go to https://twitchapps.com/tmi/ and click on Connect with Twitch
  - Copy the token from the page and paste it in the TWITCH_AUTH variable  
  - ⚠️ THIS TOKEN MIGHT EXPIRE AFTER A FEW DAYS, SO YOU MIGHT HAVE TO REPEAT THIS STEP EVERY FEW DAYS ⚠️

### 7. Text-To-Speech (TTS) Setup

Your Render URL (e.g., `https://your-twitch-bot.onrender.com/`) can be added as a widget to your stream for TTS integration.

---

## Usage

### Commands

You can interact with the bot using Twitch chat commands. By default, the command is `!gpt`. You can change this in the environment variables.

### Example

To use the `!gpt` command:

```twitch
!gpt What is the weather today?
```

The bot will respond with an OpenAI-generated message.

### Streamelements and Nightbot Integration

#### Streamelements

Create a custom command with the response:

```twitch
$(urlfetch https://your-render-url.onrender.com/gpt/"${user}:${queryescape ${1:}}")
```

#### Nightbot

Create a custom command with the response:

```twitch
!addcom !gptcmd $(urlfetch https://twitch-chatgpt-bot.onrender.com/gpt/$(user):$(querystring))
```

Replace `your-render-url.onrender.com` with your actual Render URL.
Replace `gptcmd` with your desired command name.
Remove `$(user):` if you don't want to include the username in the message sent to OpenAI.
---

## Support

For any issues or questions, please join our [Discord community](https://discord.gg/pcxybrpDx6).

Thank you for using the ChatGPT Twitch Bot! Your support is greatly appreciated. ☕ [Buy me a coffee](https://www.buymeacoffee.com/osetinhas) ☕

---

### Important Notice

**Cyclic is no longer supported for deployment. Please use Render for deploying this bot.**

---