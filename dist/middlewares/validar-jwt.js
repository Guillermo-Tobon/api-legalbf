"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const enviroments_1 = __importDefault(require("../enviroments/enviroments"));
const process = new enviroments_1.default();
class MiddlewareJWT {
    constructor() {
        //Atributos
        this.user = {};
        //Métodos
        this.validarJWT = (req, res, next) => {
            const token = req.header('x-token');
            if (!token) {
                return res.status(401).send({
                    ok: false,
                    msg: 'No hay token en la petición.'
                });
            }
            try {
                this.user = jsonwebtoken_1.default.verify(token, process.JWT_SECRET);
                next();
            }
            catch (error) {
                return res.status(401).send({
                    ok: false,
                    msg: 'Token no válido.'
                });
            }
        };
    }
}
exports.default = MiddlewareJWT;
