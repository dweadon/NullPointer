require('dotenv').config()
const bcrypt = require('bcrypt')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const db = require("./database")
const port = 3000
app.use(cors())
app.use(express.json())
const history = [];

app.post('/hash', async (req, res) => {
    const password = req.body.password
    const hashed = await bcrypt.hash(password, 10)
    res.json({
        password: password,
        hashed_password: hashed
    })
})

app.post('/register', async (req, res) => {
    const password = req.body.password
    const hash = await bcrypt.hash(password, 10)
    const username = req.body.username
    const user = db.prepare("INSERT INTO users (username, password) VALUES (?,?)")
    user.run(username, hash)
    res.json({
        username: username,
        password: hash
        
    })
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const find = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
    const token = jwt.sign({username}, "secret")
    const compare = await bcrypt.compare(password, find.password)
    if(compare){
        res.json({token: token})
    }
})
app.get('/me', (req, res) => {
    const userToken = req.headers.authorization
    const verify = jwt.verify(userToken, "secret")
    res.json({
        token: verify
    })
})
app.post('/chat', async (req,res) => {
    const message = req.body.message
    
    history.push({ role: 'user', content: message })
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: history
        })
    })
    
    const data = await response.json()
    history.push({ role: 'assistant', content: data.choices[0].message.content })
    res.json({ reply: data.choices[0].message.content })
})
app.listen(port, () => {
    console.log(`port: ${port}`)
})