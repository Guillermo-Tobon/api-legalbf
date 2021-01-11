import jwt from 'jsonwebtoken';
import Enviroments from '../enviroments/enviroments';

const process = new Enviroments();

export default class MiddlewareJWT{

  //Atributos
  public user:any = {};

  //Métodos
  public validarJWT = (req:any, res:any, next:any) =>{

    const token = req.header( 'x-token' );

    if ( !token ) {
      return res.status(401).send({
        ok: false,
        msg: 'No hay token en la petición.'
      })
    }

    try {
      this.user = jwt.verify( token, process.JWT_SECRET );
      next();
      
    } catch (error) {
      return res.status(401).send({
        ok: false,
        msg: 'Token no válido.'
      })
    }


  }







}