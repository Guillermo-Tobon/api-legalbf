"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
class MySQL {
    constructor() {
        this.conetado = false;
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
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    /**
     * Método estatico para realizar consultas e inserciones sql
     */
    static ejecutarQuery(query, callback) {
        this.instance.cnn.query(query, (err, results, fields) => {
            if (err) {
                console.log('Error en Query', err.message);
                return callback(err);
            }
            if (results.length === 0) {
                callback('No hay registros.');
            }
            else {
                callback(null, results);
            }
        });
    }
    /**
     * Método privado para conectar con la BD
     */
    conectarDB() {
        this.cnn.connect((err) => {
            if (err) {
                console.log('ERROR -> ', err.message);
                return;
            }
            this.conetado = true;
            console.log('Base de datos online!');
        });
    }
}
exports.default = MySQL;
