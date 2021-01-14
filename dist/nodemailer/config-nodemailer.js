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
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
class NodeMailer {
    constructor() {
        this.SendMailer = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'santina.white@ethereal.email',
                    pass: 'SHzGCxVxAXtNk5eP5a'
                }
            });
            const mailOptions = {
                from: '"LegalBF" <info@legalbf.com>',
                to: "gtobonbarco@gmail.com",
                subject: "Hello ✔",
                text: "Hello world?",
                html: "<b>Hello world?</b>",
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.status(400).send({
                        ok: false,
                        msg: 'No se pudo enviar el correo',
                        error: err.message
                    });
                }
                else {
                    return res.status(400).send({
                        ok: true,
                        msg: 'Correo enviado'
                    });
                }
            });
        });
    }
}
exports.default = NodeMailer;
