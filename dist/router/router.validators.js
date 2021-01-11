"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("../mysql/mysql"));
class RouterValida {
    constructor() {
        //Atributos
        this.dataUser = [];
        this.dataClient = [];
        //Método para validar usuario
        this.validarUsuario = (email, callback) => __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT * FROM usuarios WHERE email_us = '${email}'`;
            mysql_1.default.ejecutarQuery(query, (err, result) => {
                this.dataUser = result;
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, result);
                }
            });
        });
        //Método para validar cliente
        this.validarCliente = (email, callback) => __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT * FROM informacion_clientes WHERE email_cli = '${email}'`;
            mysql_1.default.ejecutarQuery(query, (err, result) => {
                this.dataClient = result;
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, result);
                }
            });
        });
    }
}
exports.default = RouterValida;
