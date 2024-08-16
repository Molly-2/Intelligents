const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let aiMemory = {};

// Load learned prompts from file on startup
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

// Save learned prompts to file
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

let chatHistory = [];

// Serve the HTML file
app.use(express.static('public'));

app.get('/ai', (req, res) => {
    const userPrompt = req.query.prompt?.toLowerCase();
    if (userPrompt) {
        chatHistory.push({ prompt: userPrompt });

        if (aiMemory[userPrompt]) {
            const response = aiMemory[userPrompt];
            chatHistory.push({ response });
            res.send(response);
        } else {
            chatHistory.push({ response: "404 Error ❗" });
            res.send("404 Error ❗");
        }
    } else {
        res.send("Please provide a prompt.");
    }
});

app.post('/teach', (req, res) => {
    const { prompt, response } = req.body;
    if (prompt && response) {
        aiMemory[prompt.toLowerCase()] = response;
        console.log('Learned:', prompt.toLowerCase(), '->', response); // Debug line
        saveMemory(); // Save the updated AI memory to file
        res.send(`Learned: "${prompt}" -> "${response}"`);
    } else {
        res.status(400).send("Invalid data format. Provide both 'prompt' and 'response'.");
    }
});

app.get('/history', (req, res) => {
    res.json(chatHistory);
});

// Inspect the current AI memory
app.get('/inspectMemory', (req, res) => {
    res.json(aiMemory);
});

app.listen(3000, () => {
    console.log('AI server is running on port 3000');
});
