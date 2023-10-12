// Import modules
import {Configuration, OpenAIApi} from "openai";

export class OpenAIOperations {
    constructor(file_context, openai_key, model_name, history_length) {
        this.messages = [{role: "system", content: file_context}];
        const configuration = new Configuration({
            apiKey: openai_key,
        });
        this.openai = new OpenAIApi(configuration);
        this.model_name = model_name;
        this.history_length = history_length;
    }

    check_history_length() {
        // Use template literals to concatenate strings
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if(this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and agent messages.');
            this.messages.splice(1,2);
        }
    }

    async make_openai_call(text) {
        try {
            //Add user message to  messages
            this.messages.push({role: "user", content: text});

            //Check if message history is exceeded
            this.check_history_length();

            // Use await to get the response from openai
            const response = await this.openai.createChatCompletion({
                model: this.model_name,
                messages: this.messages,
                temperature: 0.7,
                max_tokens: 256,
                top_p: 0.95,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            // Check if response has choices
            if (response.data.choices) {
                let agent_response = response.data.choices[0].message.content;
                console.log(`Agent Response: ${agent_response}`);
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                // Handle the case when no choices are returned
                throw new Error("No choices returned from openai");
            }
        } catch (error) {
            // Handle any errors that may occur
            console.error(error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}