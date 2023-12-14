const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const https = require('https'); // <-- Import HTTPS module
const http = require('http'); // <-- Import HTTP module
const fs = require('fs');       // <-- Import File System module
const API_URL = "https://api.openai.com/v1/chat/completions";

require('dotenv').config();

const apiKey = process.env.API_KEY
console.log(apiKey)

const app = express();
const PORT = 443;

const frameworks = "These are the 13 Comedy Frameworks: Double Entendres framework is a simple play on words that have cliché takeoffs and reformations. The Reverses framework is a joke structure that infuses the element of surprise through the last-minute switch in assumption. Triple's framework is a 3-way joke structure buildup with tension, manipulation via two logical words or conditions driven towards an expected end, a third exaggeration that shatters this assumption. Incongruity framework is juxtaposing dissimilar elements. Simple Truth framework is a simple play on words that have cliché takeoffs and reformations but with phrases that imply truth in a comedic way. The Superiority framework lures the audience to feel superior through the self-deprecation of the comedian or through attacking people the audience feels inferior to like celebrities. The Paired Phrases framework uses the rhythms of the English lexicon, like antonyms, synonyms, or homonym. Slapstick framework infuses physical gestures into your jokes by acting out. The Observation-Recognition framework exaggerates simple everyday items, events or conditions that are easily recognizable by the audience. The compare and contrast framework operates by inducing surprise by starting out complex but finishing simple. The comedic Irony framework instills surprise with the representation of dramatic irony. The Benign Retaliation framework glamorizes comedic vengeance in a relatable way. The Paradox framework is self-contradictory and allows the audience to think inversely."
const instructions = "You are a funny comedian that doesn't ask questions.  You will be writting jokes about the premise.  You will be using the 13 Comedy Frameworks and don't list the jokes with numbers or Framework type. Don't use questions.  After every joke type '\r\n\r\n'.  Write five funniest jokes using five of the 13 Comedy Frameworks.  Shorter jokes are funnier jokes.  Funny jokes don't use questions."

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).send({ error: "Prompt is required" });
    }

    try {
        const openaiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4-1106-preview',
                messages: [{"role": "system", "content": frameworks},
                {"role": "system", "content": instructions},
                {"role": "user", "content": "premise: " + prompt}],
                stream: true
            })
        });

        // Pipe the OpenAI stream response directly to the frontend
        openaiResponse.body.pipe(res);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ error: "Internal server error" });
    }
});

// Create an HTTP server that redirects all traffic to HTTPS
const httpApp = express();

httpApp.all('*', (req, res) => {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
});

httpApp.listen(80, () => {
    console.log('HTTP server running on port 80');
});

//uncomment for production
const httpsOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/jokegpt.net/privkey.pem'),        // Path to your server.key file
    cert: fs.readFileSync('/etc/letsencrypt/live/jokegpt.net/fullchain.pem')       // Path to your server.cert file
};

//delete for production
//const httpsOptions = {
//    key: fs.readFileSync('./server.key'),        // Path to your server.key file
//    cert: fs.readFileSync('./server.cert')       // Path to your server.cert file
//}


https.createServer(httpsOptions, app)
    .listen(443, () => {
        console.log(`HTTPS server running on https://localhost:443`);
    });