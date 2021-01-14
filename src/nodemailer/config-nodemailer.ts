import nodemailer = require('nodemailer');

export default class NodeMailer{

  constructor(){}

  public SendMailer =  async(req?:any, res?:any, data?:any ) => {

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
          to: "gtobonbarco@gmail.com", // list of receivers
          subject: "Hello ✔", // Subject line
          text: "Hello world?", // plain text body
          html: "<b>Hello world?</b>", // html body
      };
    
    transporter.sendMail( mailOptions, (err, info) =>{
      if (err) {

        return res.status(400).send({
          ok: false,
          msg: 'No se pudo enviar el correo',
          error: err.message
        })
        
      } else {

        return res.status(400).send({
          ok: true,
          msg: 'Correo enviado'
        })
        
      }
    })
  }




}