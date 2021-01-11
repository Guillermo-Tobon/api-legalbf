"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cors = require("cors");
const server_1 = __importDefault(require("./server/server"));
const router_1 = __importDefault(require("./router/router"));
const mysql_1 = __importDefault(require("./mysql/mysql"));
const port = process.env.PORT || 3000;
const server = server_1.default.init(parseInt(port));
server.app.use(bodyParser.urlencoded({ extended: false }));
server.app.use(bodyParser.json());
server.app.use(cors());
server.app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('content-type', 'application/json');
    next();
});
server.app.use(router_1.default);
mysql_1.default.instance;
server.start(() => { });
