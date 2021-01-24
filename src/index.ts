import bodyParser = require('body-parser');
import cors = require('cors');
import FileUpload = require('express-fileupload');

import Server from './server/server';
import router from './router/router';
import MySQL from './mysql/mysql';


const port:any = process.env.PORT || 3000;
const server = Server.init( parseInt(port) );
server.app.use(bodyParser.urlencoded({ extended: false }));
server.app.use(bodyParser.json());
server.app.use(cors());
server.app.use(FileUpload());
server.app.use((req, res, next) =>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('content-type', 'application/json');
  next();
})
server.app.use( router );

MySQL.instance;

server.start( () =>{} );