import jwt from 'jsonwebtoken';
import Enviroments from '../enviroments/enviroments';

export default class JsonWebToken{
  
  //Métodos
  public generarJWT = (id:number, email:string) =>{
    
    const payLoad = { id, email };
    const process = new Enviroments();

    return new Promise( (resolve, reject) =>{
      jwt.sign( payLoad, process.JWT_SECRET, { expiresIn: '12h' }, (err, token) =>{

        if (err) {
          reject(`No se pudo crear el JWT -> ${err}`);
  
        } else {
          resolve( token );
        }
  
      })
    });

  }

  
} 