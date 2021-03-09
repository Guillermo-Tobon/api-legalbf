import nodemailer = require('nodemailer');

export default class NodeMailer{

  public dataInfo:any;

  constructor( data:any ){
    this.dataInfo = data;
  }

  public SendMailer = (req?:any, res?:any) => {

    const transporter = nodemailer.createTransport({
          host: 'mail.clientslegalbf.com',
          port: 465,
          secure: true,
          auth: {
            user: 'clientslegalbf@clientslegalbf.com',
            pass: '5kDP@(J?Bf#a'
          }
      });

    const mailOptions = {
          from: '"Clients LegalBF" <clientslegalbf@clientslegalbf.com>',
          to: `${this.dataInfo.email}`, 
          subject: `${this.dataInfo.asunto} ✔`, 
          html: `<b>${this.dataInfo.asunto}</b>
                 <p>Sr(a) ${this.dataInfo.nombres} ${this.dataInfo.apellidos}</p>
                 ${this.dataInfo.descripcion}`,
      };
    
    transporter.sendMail( mailOptions, (err:any, info:any) =>{
      if (err) {

        return res.status(400).send({
          ok: false,
          msg: 'Email could not be sent.',
          error: err.message
        })
        
      } else {

        return res.status(200).send({
          ok: true,
          msg: 'Send email'
        })
        
      }
    })
  }




}