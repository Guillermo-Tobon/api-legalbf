import express = require('express');


export default class Server {

  public app: express.Application;
  public port: Number | undefined;

  constructor( puerto: Number ){
    this.port = puerto;
    this.app = express();
  }


  static init(puerto:Number){
    return new Server( puerto );
  }


  start( callback: Function ){
    this.app.listen( this.port, () =>{
      console.log(`Server corriendo en el puerto ${this.port}`);
    })
  }


}