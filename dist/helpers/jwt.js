"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const enviroments_1 = __importDefault(require("../enviroments/enviroments"));
class JsonWebToken {
    constructor() {
        //Métodos
        this.generarJWT = (id, email) => {
            const payLoad = { id, email };
            const process = new enviroments_1.default();
            return new Promise((resolve, reject) => {
                jsonwebtoken_1.default.sign(payLoad, process.JWT_SECRET, { expiresIn: '12h' }, (err, token) => {
                    if (err) {
                        reject(`No se pudo crear el JWT -> ${err}`);
                    }
                    else {
                        resolve(token);
                    }
                });
            });
        };
    }
}
exports.default = JsonWebToken;
