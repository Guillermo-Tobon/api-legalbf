"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cron = require("node-cron");
const bcrypt = require("bcryptjs");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router_validators_1 = __importDefault(require("./router.validators"));
const jwt_1 = __importDefault(require("../helpers/jwt"));
const validar_jwt_1 = __importDefault(require("../middlewares/validar-jwt"));
const routValida = new router_validators_1.default();
const jwt = new jwt_1.default();
const middleware = new validar_jwt_1.default();
const router = express_1.Router();
/*******************************************************************************************/
/*********** MÉTODOS POST ************/
/*******************************************************************************************/
/**
 * Método POST para insertar usuario nuevo
 */
router.post('/api/insertUsuario', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield routValida.validarUsuario(req.body.email, (err, data) => {
        if (data) {
            return res.status(400).send({
                ok: false,
                msg: 'El usuario con este correo electrónico ya está registrado'
            });
        }
        if (err) {
            if (err == 'No hay registros.') {
                //Encriptar contraseña
                const salt = bcrypt.genSaltSync();
                const password = bcrypt.hashSync(req.body.password, salt);
                const query = `
        INSERT INTO usuarios 
        (nombres_us, apellidos_us, email_us, password_us, telefono_us, compania_us, fecha_reg_us, estado_us, admin_us)
        VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${password}', '${req.body.telefono}', '${req.body.compania}', CURRENT_TIMESTAMP(), 1, 'N' )`;
                mysql_1.default.ejecutarQuery(query, (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            ok: false,
                            error: err,
                            query
                        });
                    }
                    res.status(200).send({
                        ok: true,
                        msg: 'Usuario registrado con éxito.',
                        result
                    });
                });
            }
            else {
                return res.status(400).send({
                    ok: false,
                    msg: 'Problema al consultar el usuario.',
                    err
                });
            }
        }
    });
}));
/**
 * Método POST para iniciar sesión
 */
router.post('/api/loginUser', (req, res) => {
    const { email, password } = req.body;
    const queryUs = `SELECT * FROM usuarios WHERE email_us = '${email}'`;
    try {
        mysql_1.default.ejecutarQuery(queryUs, (err, result) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                if (err == 'No hay registros.') {
                    return res.status(400).send({
                        ok: false,
                        err,
                        msg: 'E-mail y/o password incorrectos.'
                    });
                }
                else {
                    return res.status(400).send({
                        ok: false,
                        err,
                        msg: 'Error en la consulta de usuario. Intente más tarde.'
                    });
                }
            }
            else {
                const passUser = bcrypt.compareSync(password, result[0].password_us);
                if (!passUser) {
                    return res.status(400).send({
                        ok: false,
                        err: 'Password incorrecto.',
                        msg: 'E-mail y/o password son incorrectos.'
                    });
                }
                else {
                    //Generar un token - JWT
                    const token = yield jwt.generarJWT(result[0].id, result[0].email);
                    return res.status(200).send({
                        ok: true,
                        err,
                        msg: 'Login correcto!',
                        token
                    });
                }
            }
        }));
    }
    catch (error) {
        return res.status(500).send({
            ok: false,
            msg: 'Error inesperado en login... Revisar logs',
            error
        });
    }
});
/**
 * Método POST para insertar clientes nuevos
 */
router.post('/api/insertCliente', middleware.validarJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Primero consultamos si existe el cliente
    yield routValida.validarCliente(req.body.email, (err, data) => {
        if (data) {
            return res.status(400).send({
                ok: false,
                msg: 'El cliente con este correo electrónico ya está registrado.'
            });
        }
        if (err) {
            if (err == 'No hay registros.') {
                const query = `
            INSERT INTO informacion_clientes
            (nombres_cli, apellidos_cli, email_cli, telefono_cli, compania_cli, estado_cli, fechareg_cli )
            VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${req.body.telefono}', '${req.body.compania}', ${req.body.estado}, CURRENT_TIMESTAMP() )`;
                mysql_1.default.ejecutarQuery(query, (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            ok: false,
                            msg: 'Problema al crear el cliente.',
                            err
                        });
                    }
                    res.status(200).send({
                        ok: true,
                        msg: 'Cliente registrado con éxito.',
                        result
                    });
                });
            }
            else {
                return res.status(400).send({
                    ok: false,
                    msg: 'Problema al consultar el cliente.',
                    err
                });
            }
        }
    });
}));
/**
 * Método POST para actualizar cliente por id
 */
router.put('/api/updateCliente', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE informacion_clientes
                SET nombres_cli = '${req.body.nombres}', apellidos_cli = '${req.body.apellidos}', email_cli = '${req.body.email}', telefono_cli = '${req.body.telefono}', compania_cli = '${req.body.compania}', estado_cli = ${req.body.estado}
                WHERE id_cli = ${req.body.id} `;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        if (result.affectedRows == 0) {
            return res.status(400).send({
                ok: false,
                msg: 'No es posible actualizar el cliente. Verifica los datos.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Cliente actualizado con éxito.',
                result
            });
        }
    });
});
/*******************************************************************************************/
/*********** MÉTODOS GET ************/
/*******************************************************************************************/
/**
 * Método GET para validar en token de seguridad
 */
router.get('/api/loginrenew', middleware.validarJWT, (req, res) => {
    const token = req.header('x-token');
    return res.status(200).send({
        ok: true,
        msg: 'Usuario valido.',
        token
    });
});
/**
 *Método GET que obtiene todos los usuarios administradores
 */
router.get('/api/usuarios', middleware.validarJWT, (req, res) => {
    const query = `SELECT * FROM usuarios`;
    mysql_1.default.ejecutarQuery(query, (err, usuarios) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                usuarios
            });
        }
    });
});
/**
 *Método GET que obtiene todos los clientes
 */
router.get('/api/clientes', middleware.validarJWT, (req, res) => {
    const query = `SELECT * FROM informacion_clientes`;
    mysql_1.default.ejecutarQuery(query, (err, clientes) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                clientes
            });
        }
    });
});
/**
 *Método GET que obtiene usuario por id
 */
router.get('/usuario/:id', (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const query = `
                SELECT * 
                FROM usuarios 
                WHERE num_identifica_us = ${escapeId}`;
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                usuario: usuario[0]
            });
        }
    });
});
/**
 * Método GET que obtiene la orientación según el filtro
 */
router.get('/orientacion/:idVio/:idAgre', (req, res) => {
    const escIdVio = mysql_1.default.instance.cnn.escape(req.params.idVio);
    const escIdAgre = mysql_1.default.instance.cnn.escape(req.params.idAgre);
    const query = `
                SELECT T1.tipo_vio AS tipoViolencia, T2.tipo_agre AS tipoAgresor,  T3.titulo_ori AS titulo, T3.texto_ori AS texto
                FROM info_orientacion AS T3
                INNER JOIN violencia AS T1 ON T1.id_vio = T3.id_violencia_ori
                INNER JOIN agresor AS T2 ON T2.id_agre = T3.id_agresor_ori
                WHERE id_violencia_ori = ${escIdVio} AND id_agresor_ori = ${escIdAgre}`;
    mysql_1.default.ejecutarQuery(query, (err, orientacion) => {
        if (err) {
            res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                orientacion
            });
        }
    });
});
/**
 * Método GET que obtiene las entidades por ID
 */
router.get('/entidades/:idEnti', (req, res) => {
    const escIdEnti = mysql_1.default.instance.cnn.escape(req.params.idEnti);
    const query = `
                SELECT *
                FROM entidades_manizales
                WHERE cod_enti = ${escIdEnti}`;
    mysql_1.default.ejecutarQuery(query, (err, entidades) => {
        if (err) {
            res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                entidades
            });
        }
    });
});
/**
 * Método GET que obtiene los artículos de información por orden ascendente
 */
router.get('/informacion', (req, res) => {
    const query = `SELECT * FROM informacion ORDER BY fecha_info DESC`;
    mysql_1.default.ejecutarQuery(query, (err, informacion) => {
        if (err) {
            res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                informacion
            });
        }
    });
});
//================================================================
//================================================================
/**
 * Método que mantiene la conexión de MySQL
 */
cron.schedule('*/3 * * * *', () => {
    const hora = new Date().getTime();
    mysql_1.default.ejecutarQuery('SELECT 1', (err, result) => {
        if (err) {
            throw new Error("Error conexión");
        }
        else {
            console.log(`Conexión constante!! ${result} - ${hora}`);
        }
    });
});
exports.default = router;
