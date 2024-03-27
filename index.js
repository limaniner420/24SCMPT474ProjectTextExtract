const fs = require('fs');
const express = require('express');
const https = require('https')
const cors = require('cors');
const reader = require('any-text');
const multer = require('multer');
const qs = require('querystring')
const path = require('path')

const app = express();

const options = {
    host: process.env.PRSERVICE_URL || 'sfu24spcmpt474a2eca103-4ora5oxrra-uc.a.run.app',
    path: '/v2/check',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}

if(!fs.existsSync(path.join(__dirname, 'tmp'))){
    fs.mkdirSync(path.join(__dirname, 'tmp'), (err) => {
        if(err){
            console.log(err)
        }
    })
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'tmp/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage }).single('textFile');

const addr = 'localhost';
const port = 3002;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: '*'
}));

app.post('/extract', upload, async (req, res) => {
    let clientRes = res
    
    let data = await reader.getText(req.file.path);
    
    let chunks = [];
    let parsedRes;
    let prReq = https.request(options, (res) => {
        res.setEncoding('binary');
        res.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk, 'binary'));
        });
        res.on('end', () => {
            parsedRes = Buffer.concat(chunks);
            clientRes.send(JSON.parse(parsedRes))
        })
    })
    prReq.write(qs.stringify({
        'text': data,
        'language': 'en-US'
    }));
    fs.unlinkSync(req.file.path);
    prReq.end();
})

app.listen(port, addr);
console.log(`Running on http://localhost:${port}`);

