import MySQL from '../mysql/mysql';
import bcrypt = require('bcryptjs');



export default class RouterValida {

  //Atributos
  public dataUser:any[] = [];
  public dataClient:any[] = [];


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


  


}