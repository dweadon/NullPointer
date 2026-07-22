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

 app.use((req, res, next) => {
    console.log(req.method, req.url)
    next()
})

app.post('/register', async (req,res) => {
    const username = req.body.username
    const password = req.body.password
    const find = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
    if (find){
        return res.status(409).json({
            message: "User already exists"
        })
    }
    const save = db.prepare("INSERT INTO users (username, password)VALUES (?, ?)")
    const hash = await bcrypt.hash(password, 10)
    save.run(username, hash)
    
    if (save){
    res.json({
        username: username
    })
}
}) 

app.post('/login', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const find = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
    if (!find){
        return res.status(404).json({
            message: "Couldn't find username"
        })
    }
    const compare = await bcrypt.compare(password, find.password)
    if (!compare) {
        return res.status(401).json({
            message: "Invalid username or password"
        })
    }
    const token = jwt.sign(
        {
            id: find.id,
            username: find.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    )
    if (find) {
        res.json({
            token: token
        })
    }
})
app.get("/", (req,res)=>{
    res.send("Backend works")
})
app.get('/me', (req,res) => {
    const token = req.headers.authorization
    try {
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET)
        return res.json({username: verifyToken.username,id: verifyToken.id})
    }
    catch{
    return res.status(401).json({
        message: "Couldn't verify the token"
    })
    }

})
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})