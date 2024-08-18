const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios'); // Import Axios for making API requests

const app = express();
const port = 3000; // Port for the server

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Object to store AI memory (learned prompts)
let aiMemory = {};

// Load learned prompts from a file on server startup
function loadMemory() {
    try {
        if (fs.existsSync('teach.txt')) {
            const data = fs.readFileSync('teach.txt', 'utf-8');
            aiMemory = JSON.parse(data);
            console.log('Memory loaded successfully');
        }
    } catch (error) {
        console.error('Error loading AI memory:', error);
        aiMemory = {}; // Reset memory in case of error
    }
}

// Save learned prompts to a file
function saveMemory() {
    try {
        fs.writeFileSync('teach.txt', JSON.stringify(aiMemory, null, 2));
        console.log('Memory saved successfully');
    } catch (error) {
        console.error('Error saving AI memory:', error);
    }
}

// Initial load of AI memory
loadMemory();

// Array to store chat history
let chatHistory = [];

// Serve static HTML files
app.use(express.static('public'));

// Helper function to get a random response from an array of responses
function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

// AI response endpoint
app.get('/ai', async (req, res) => {
    const userPrompt = req.query.prompt?.toLowerCase();

    if (userPrompt) {
        chatHistory.push({ prompt: userPrompt });

        if (aiMemory[userPrompt]) {
            // If the prompt is recognized, respond with a stored response
            const responses = aiMemory[userPrompt];
            const response = getRandomResponse(responses);
            chatHistory.push({ response });
            res.send(response);
        } else {
            try {
                // Fallback to external API, appending "Regards, Hassan" to the response
                const apiResponse = await axios.get(`https://hassan-llama3-aipk.onrender.com/llama3?prompt=${encodeURIComponent(userPrompt)}`, {
                    timeout: 5000 // timeout after 5 seconds
                });

                let response = apiResponse.data.response;

                // Ensure the external API response mentions "Hassan"
                response = `${response} - Regards, Hassan`;

                // Save the response to AI memory
                aiMemory[userPrompt] = aiMemory[userPrompt] || [];
                aiMemory[userPrompt].push(response);
                saveMemory(); // Save the updated AI memory to file

                chatHistory.push({ response });
                res.send(response);
            } catch (error) {
                console.error('Error fetching response from external API:', error.message || error);
                res.send("404 Error ❗");
            }
        }
    } else {
        res.send("Please provide a prompt.");
    }
});

// Teach the AI new prompts and responses
app.post('/teach', (req, res) => {
    const { prompt, response } = req.body;

    if (prompt && response) {
        const lowerCasePrompt = prompt.toLowerCase();
        aiMemory[lowerCasePrompt] = aiMemory[lowerCasePrompt] || [];
        aiMemory[lowerCasePrompt].push(response);

        console.log('Learned:', lowerCasePrompt, '->', response); // Debugging log
        saveMemory(); // Save the updated AI memory to file

        res.send(`Learned: "${prompt}" -> "${response}"`);
    } else {
        res.status(400).send("Invalid data format. Provide both 'prompt' and 'response'.");
    }
});

// Endpoint to return chat history
app.get('/history', (req, res) => {
    res.json(chatHistory);
});

// Endpoint to inspect the current AI memory
app.get('/inspectMemory', (req, res) => {
    res.json(aiMemory);
});

// Start the server
app.listen(port, () => {
    console.log(`AI server is running on port ${port}`);
});
