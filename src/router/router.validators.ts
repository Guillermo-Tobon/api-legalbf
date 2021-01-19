import MySQL from '../mysql/mysql';
import bcrypt = require('bcryptjs');



export default class RouterValida {

  //Atributos
  public dataUser:any[] = [];
  public dataClient:any[] = [];
  public dataTicket:any[] = [];


  //Método para validar usuario
  public validarUsuario = async(email:string, callback:Function) =>{

    const query = `SELECT * FROM usuarios WHERE email_us = '${email}'`;
    
    MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{

      this.dataUser = result;

      if ( err ) {
        callback(err, null);
  
      } else {
        callback(null, result);
      }
    })

  }




  //Método para validar cliente
  public validarCliente = async(email:string, callback:Function) =>{

    const query = `SELECT * FROM informacion_clientes WHERE email_cli = '${email}'`;

    MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{

      this.dataClient = result;

      if ( err ) {
        callback(err, null);
  
      } else {
        callback(null, result);
      }
    })

  }



  //Método para validar cliente
  public validarTicket = (email:string, callback:Function) =>{

    const query = `SELECT * FROM tickets_clientes WHERE email_tic = '${email}' AND estado_tic = 0`;

    MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{

      this.dataTicket = result;

      if ( err ) {
        callback(err, null);
  
      } else {
        callback(null, result);
      }
    })

  }


  


}