"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
class NodeMailer {
    constructor(data) {
        this.SendMailer = (req, res) => {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'desarrollomemo@gmail.com',
                    pass: 'abawmliitfhovslp'
                }
            });
            const mailOptions = {
                from: '"LegalBF" <info@legalbf.com>',
                to: `${this.dataInfo.email}`,
                subject: `${this.dataInfo.asunto} ✔`,
                html: `<b>${this.dataInfo.asunto}</b>
                 <p>Señor(a) ${this.dataInfo.nombres} ${this.dataInfo.apellidos}</p>
                 ${this.dataInfo.descripcion}`,
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.status(400).send({
                        ok: false,
                        msg: 'No se pudo enviar el correo electrónico.',
                        error: err.message
                    });
                }
                else {
                    return res.status(200).send({
                        ok: true,
                        msg: 'Correo enviado'
                    });
                }
            });
        };
        this.dataInfo = data;
    }
}
exports.default = NodeMailer;
