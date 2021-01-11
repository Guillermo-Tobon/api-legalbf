import mysql = require('mysql');

export default class MySQL{

  private static _instance: MySQL;

  public cnn: mysql.Connection;
  public conetado: boolean = false;

  constructor(){
    console.log('Clase inicializada!');

    this.cnn = mysql.createConnection({
      host: '162.251.80.225',
      user: 'legalkqk_uslegal',
      password: 's&oA8UC[g{RH',
      database: 'legalkqk_dblegal'
    });

    this.conectarDB();
  }


  /**
   * Patrón Singleton
   */
  public static get instance(){
    return this._instance || ( this._instance = new this() );
  }

  /**
   * Método estatico para realizar consultas e inserciones sql
   */
  public static ejecutarQuery( query:string, callback: Function ){

    this.instance.cnn.query( query, (err, results: Object[], fields) =>{

      if ( err ) {
        console.log('Error en Query', err.message);
        return callback(err);
      }
      if ( results.length === 0 ) {
        callback('No hay registros.');

      } else {
        callback(null, results);
      }

    });
  }

  /**
   * Método privado para conectar con la BD
   */
  private conectarDB(){
    this.cnn.connect( (err: mysql.MysqlError) =>{

      if ( err ) {
        console.log('ERROR -> ', err.message);
        return;
      }

      this.conetado = true;
      console.log('Base de datos online!');

    });
  }




}