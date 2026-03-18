require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/auth', require('./routes/authroute'))    
app.use('/file', require('./routes/fileuploadroute'))

app.get('/', (req, res) => {
  res.json({ name: 'Speech to text converter backend' })
})

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log('Listening at port ' + process.env.PORT)
})



