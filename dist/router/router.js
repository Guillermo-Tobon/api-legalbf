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
const { v4: uuidv4 } = require('uuid');
const config_nodemailer_1 = __importDefault(require("../nodemailer/config-nodemailer"));
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router_validators_1 = __importDefault(require("./router.validators"));
const jwt_1 = __importDefault(require("../helpers/jwt"));
const validar_jwt_1 = __importDefault(require("../middlewares/validar-jwt"));
const upload_1 = __importDefault(require("../uploads/upload"));
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
                msg: 'The user with this email is already registered'
            });
        }
        if (err) {
            if (err == 'No hay registros.') {
                //Encriptar contraseña
                const salt = bcrypt.genSaltSync();
                const password = bcrypt.hashSync(req.body.password, salt);
                const query = `
        INSERT INTO usuarios 
        (nombres_us, apellidos_us, email_us, password_us, telefono_us, pais_us, compania_us, descripcion_us, fecha_reg_us, estado_us, admin_us)
        VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${password}', '${req.body.telefono}', '${req.body.pais}', '${req.body.compania}', '${req.body.descripcion}', CURRENT_TIMESTAMP(), 1, 'N' )`;
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
                        msg: 'Registered user successfully.',
                        result
                    });
                });
            }
            else {
                return res.status(400).send({
                    ok: false,
                    msg: 'Problem when querying the user.',
                    err
                });
            }
        }
    });
}));
/**
 * Método POST para insertar inversiones
 */
router.post('/api/insertInversion', middleware.validarJWT, (req, res) => {
    let idInver = uuidv4();
    idInver = idInver.split('-');
    const query = `INSERT INTO inversiones_clientes 
                 ( id_inv, id_us_inv, nombre_inv, capital_extra_inv, moneda_extra_inv, tasa_cambio_inv, capital_cop_inv, tiempo_inv, tasa_ea_inv, interes_extra_inv, interes_cop_inv, renta_extra_inv, renta_cop_inv, pais_inv, descripcion_inv, estado_inv, fechareg_inv )
                 VALUES ( '${idInver[0]}', ${req.body.idUs}, '${req.body.nombreInver}', ${req.body.capitalExtra}, '${req.body.monedaInver}', '${req.body.tasaCambio}', ${req.body.capitalCop}, ${req.body.tiempo}, '${req.body.tasaEA}', '${req.body.interesExtra}', '${req.body.interesCop}', ${req.body.rentaExtra}, ${req.body.rentaCop}, '${req.body.pais}', '${req.body.descripcion}', ${req.body.estado}, CURRENT_TIMESTAMP() ) `;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                msg: 'Problem creating the project.',
                err: query
            });
        }
        res.status(200).send({
            ok: true,
            msg: 'Successfully created project.',
            idInver: idInver[0],
            result
        });
    });
});
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
                        msg: 'Incorrect email and/or password.'
                    });
                }
                else {
                    return res.status(400).send({
                        ok: false,
                        err,
                        msg: 'User query failed. Try again later.'
                    });
                }
            }
            else {
                const passUser = bcrypt.compareSync(password, result[0].password_us);
                if (!passUser) {
                    return res.status(400).send({
                        ok: false,
                        err: 'Password failed.',
                        msg: 'Incorrect email and/or password.'
                    });
                }
                else if (result[0].estado_us === 0) {
                    return res.status(400).send({
                        ok: false,
                        err: 'Access denied.',
                        msg: 'Your account is locked. contact the administrator.'
                    });
                }
                else {
                    //Generar un token - JWT
                    const token = yield jwt.generarJWT(result[0].id_us, result[0].email_us);
                    return res.status(200).send({
                        ok: true,
                        err,
                        msg: 'Login correct!',
                        token
                    });
                }
            }
        }));
    }
    catch (error) {
        return res.status(500).send({
            ok: false,
            msg: 'Unexpected login error ... Check logs',
            error
        });
    }
});
/**
 * Método POST para insertar ticket nuevos
 */
router.post('/api/crearticket', middleware.validarJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Primero consultamos si existe el ticket pendiente
    routValida.validarTicket(req.body.email, (err, data) => {
        if (data) {
            return res.status(400).send({
                ok: false,
                msg: `Have a ticket ( ${data[0].id_tic} ) pending answer. contact the administrator.`,
                data
            });
        }
        if (err) {
            if (err == 'No hay registros.') {
                let idTicket = uuidv4();
                idTicket = idTicket.split('-');
                const query = `
            INSERT INTO tickets_clientes
            (id_tic, id_cliente_tic, nombre_tic, email_tic, telefono_tic, compania_tic, asunto_tic, mensaje_tic,  estado_tic, fechareg_tic )
            VALUES ( '${idTicket[0]}', ${req.body.id}, '${req.body.nombrecompleto}', '${req.body.email}', '${req.body.telefono}', '${req.body.compania}', '${req.body.asunto}', '${req.body.descripcion}', 0, CURRENT_TIMESTAMP() )`;
                mysql_1.default.ejecutarQuery(query, (err, result) => {
                    if (err) {
                        return res.status(400).send({
                            ok: false,
                            msg: 'Problem creating ticket.',
                            err: query
                        });
                    }
                    res.status(200).send({
                        ok: true,
                        msg: 'Ticket created successfully.',
                        idticket: idTicket[0]
                    });
                });
            }
            else {
                return res.status(400).send({
                    ok: false,
                    msg: 'Problem when consulting the ticket.',
                    err
                });
            }
        }
    });
}));
/**
 * Método POST para enviar correos
 */
router.post('/api/email', middleware.validarJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const nodemailer = new config_nodemailer_1.default(req.body);
    yield nodemailer.SendMailer(req, res);
}));
/**
 * Método POST para insertar anexos
 */
router.post('/api/insertAnexo', middleware.validarJWT, (req, res) => {
    let idAnexo = uuidv4();
    idAnexo = idAnexo.split('-');
    const query = `INSERT INTO anexos_inversiones 
                 ( id_anex, id_inv, id_us_inv, movimiento_anex, capital_extra_anex, capital_cop_anex, interes_extra_anex, interes_cop_anex, capital_interes_extra_anex, capital_interes_cop_anex, moneda_anex,  descripcion_anex, fechpublica_anex )
                 VALUES ( '${idAnexo[0]}', '${req.body.idInversion}', ${req.body.idUser}, '${req.body.movimiento}', ${req.body.capitalExtra}, ${req.body.capitalCop}, '${req.body.interesExtra}', '${req.body.interesCop}', ${req.body.capiInterExtra}, ${req.body.capiInterCop}, '${req.body.monedaAnex}', '${req.body.comentario}', '${req.body.fecha}' ) `;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                msg: 'Problem creating annex.',
                err: query
            });
        }
        return res.status(200).send({
            ok: true,
            msg: 'Annex created successfully.',
            idAnexo: idAnexo[0],
            result
        });
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
    const query = `
                SELECT * 
                FROM usuarios 
                WHERE id_us = ${middleware.user.id} AND email_us = '${middleware.user.email}'`;
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Usuario valido.',
                token,
                usuario
            });
        }
    });
});
/**
 *Método GET que obtiene todos los usuarios administradores
 */
router.get('/api/usuarios', middleware.validarJWT, (req, res) => {
    const query = `SELECT * FROM usuarios WHERE id_us NOT IN (1)`;
    mysql_1.default.ejecutarQuery(query, (err, usuarios) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                usuarios
            });
        }
    });
});
/**
 *Método GET que obtiene el usuario por id
 */
router.get('/api/usuarios/:idUser', middleware.validarJWT, (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.idUser);
    const query = `SELECT * FROM usuarios WHERE id_us = ${escapeId} `;
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                usuario
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
 *Método GET que obtiene todos los tickets
 */
router.get('/api/alltickets', middleware.validarJWT, (req, res) => {
    const query = ` SELECT * FROM tickets_clientes `;
    mysql_1.default.ejecutarQuery(query, (err, tickets) => {
        if (err) {
            res.status(400).send({
                ok: false,
                msg: 'It is not possible to obtain the tickets. Please try again later.',
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                tickets
            });
        }
    });
});
/**
 *Método GET que obtiene los tickets por id de usuario
 */
router.get('/api/tickets/:id', middleware.validarJWT, (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const query = `
                SELECT * 
                FROM tickets_clientes 
                WHERE id_cliente_tic = ${escapeId}`;
    mysql_1.default.ejecutarQuery(query, (err, tickets) => {
        if (err) {
            res.status(400).send({
                ok: false,
                msg: 'It is not possible to obtain the tickets. Please try again later.',
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                tickets
            });
        }
    });
});
/**
 *Método GET que obtiene las inversiones por id de usuario
 */
router.get('/api/inversiones', middleware.validarJWT, (req, res) => {
    const query = ` SELECT * FROM inversiones_clientes ORDER BY fechareg_inv DESC `;
    mysql_1.default.ejecutarQuery(query, (err, inversiones) => {
        if (err) {
            res.status(400).send({
                ok: false,
                msg: 'Projects cannot be obtained. Please try again later.',
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                inversiones
            });
        }
    });
});
/**
 *Método GET que obtiene las inversiones por id de usuario
 */
router.get('/api/inversiones/:id', middleware.validarJWT, (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const query = `
                SELECT * 
                FROM inversiones_clientes 
                WHERE id_us_inv = ${escapeId}`;
    mysql_1.default.ejecutarQuery(query, (err, inversiones) => {
        if (err) {
            res.status(400).send({
                ok: false,
                msg: 'Projects cannot be obtained. Please try again later.',
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                inversiones
            });
        }
    });
});
/**
 *Método GET que obtiene todos los archivos
 */
router.get('/api/archivos', middleware.validarJWT, (req, res) => {
    const query = ` SELECT T0.*, T1.nombres_us
                  FROM informacion_clientes AS T0 INNER JOIN usuarios AS T1 
                  ON id_us_info = id_us 
                  ORDER BY fech_publica_info DESC `;
    mysql_1.default.ejecutarQuery(query, (err, archivos) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                archivos
            });
        }
    });
});
/**
 *Método GET que obtiene los archivos por id de usuario
 */
router.get('/api/archivos/:id', middleware.validarJWT, (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const query = ` SELECT * FROM informacion_clientes WHERE  id_us_info = ${escapeId}`;
    mysql_1.default.ejecutarQuery(query, (err, archivos) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                archivos
            });
        }
    });
});
/**
 *Método GET que obtiene los archivos por id de usuario y id inversión
 */
router.get('/api/archivos/:idInversion/:id', middleware.validarJWT, (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const escapeInver = mysql_1.default.instance.cnn.escape(req.params.idInversion);
    const query = ` SELECT * 
                  FROM informacion_clientes 
                  WHERE id_us_info = ${escapeId} AND id_inv = ${escapeInver}`;
    mysql_1.default.ejecutarQuery(query, (err, archivos) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                archivos
            });
        }
    });
});
/**
 *Método GET que obtiene los anexos por id de inversión
 */
router.get('/api/anexos/:idInversion', middleware.validarJWT, (req, res) => {
    const escapeIdInver = mysql_1.default.instance.cnn.escape(req.params.idInversion);
    const query = `
                SELECT T0.*, DATE_FORMAT(T0.fechpublica_anex, '%d-%m-%Y') AS fechAnexo, T1.id_info, T1.nom_archivo_info, T1.tipo_archivo_info
                FROM anexos_inversiones as T0 INNER JOIN informacion_clientes AS T1 ON T0.id_anex = T1.id_anex
                WHERE T0.id_inv = ${escapeIdInver} ORDER BY T0.id_anex ASC `;
    mysql_1.default.ejecutarQuery(query, (err, anexos) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                msg: 'Unable to get annexes. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                anexos
            });
        }
    });
});
/**
 *Método GET que obtiene la imagen
 */
router.get('/api/getarchivo/:extension/:archivo', middleware.validarJWT, (req, res) => {
    upload_1.default.returnFile(req, res);
});
/**
 *Método GET que obtiene los usuarios y sus inversiones
 */
router.get('/api/usuariosInversion', middleware.validarJWT, (req, res) => {
    const query = `
                SELECT T0.id_us, T0.nombres_us, T0.compania_us, T0.email_us, T1.nombre_inv, T1.capital_inv, T1.moneda_inv, T1.tiempo_inv, T1.tasa_ea_inv  
                FROM usuarios AS T0 INNER JOIN  inversiones_clientes AS T1 ON T0.id_us = T1.id_us_inv
                WHERE T0.estado_us = 1 ORDER BY T0.id_us ASC`;
    mysql_1.default.ejecutarQuery(query, (err, datos) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                msg: 'Unable to get annexes. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                datos
            });
        }
    });
});
/*******************************************************************************************/
/*********** MÉTODOS PUT ************/
/*******************************************************************************************/
/**
 * Método PUT para actualizar cliente por id
 */
router.put('/api/updateCliente', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE usuarios
                SET nombres_us = '${req.body.nombres}', apellidos_us = '${req.body.apellidos}', email_us = '${req.body.email}', telefono_us = '${req.body.telefono}', pais_us = '${req.body.pais}', compania_us = '${req.body.compania}', descripcion_us = '${req.body.descripcion}', estado_us = ${req.body.estado}
                WHERE id_us = ${req.body.id} `;
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
                msg: 'The client cannot be updated. Check the data.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Successfully updated client.',
                result
            });
        }
    });
});
/**
 * Método PUT para cargar archivos del cliente
 */
router.put('/api/uploadfile/:idInversion/:idAnexo/:id', [middleware.validarJWT, upload_1.default.uploadsFile], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const escapeIdInver = mysql_1.default.instance.cnn.escape(req.params.idInversion);
    const escapeIdAnex = mysql_1.default.instance.cnn.escape(req.params.idAnexo);
    if (upload_1.default.upFile) {
        const query = `
            INSERT INTO informacion_clientes
            (id_us_info, id_inv, id_anex, nom_archivo_info, tipo_archivo_info, fech_publica_info )
            VALUES ( ${escapeId}, ${escapeIdInver}, ${escapeIdAnex}, '${upload_1.default.nomDocumento}', '${upload_1.default.extenFile}', CURRENT_TIMESTAMP() )`;
        mysql_1.default.ejecutarQuery(query, (err, result) => {
            if (err) {
                return res.status(400).send({
                    ok: false,
                    msg: 'Problem creating information.',
                    err
                });
            }
            return res.status(200).send({
                ok: true,
                msg: 'Information registered successfully.',
                result
            });
        });
    }
}));
/**
 * Método PUT para actualizar tickets por usuario
 */
router.put('/api/updateTicket', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE tickets_clientes
                SET asunto_tic = '${req.body.asunto}', mensaje_tic = '${req.body.mensaje}'
                WHERE id_tic = '${req.body.idTicket}' `;
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
                msg: 'It is not possible to update the ticket. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Ticket updated successfully.',
                result
            });
        }
    });
});
/**
 * Método PUT para responder tickets por usuario
 */
router.put('/api/answerTicket', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE tickets_clientes
                SET respuesta_tic = '${req.body.respuesta}', estado_tic = 1
                WHERE id_tic = '${req.body.idTicket}' `;
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
                msg: 'Unable to reply to the ticket. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Ticket answered successfully.',
                result
            });
        }
    });
});
/**
 * Método PUT para actualizar la inversión
 */
router.put('/api/updateInversion', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE inversiones_clientes
                SET nombre_inv = '${req.body.nombreInver}', capital_extra_inv = ${req.body.capitalExtra}, moneda_extra_inv = '${req.body.monedaInver}', tasa_cambio_inv = '${req.body.tasaCambio}', capital_cop_inv = ${req.body.capitalCop}, tiempo_inv = ${req.body.tiempo}, tasa_ea_inv = '${req.body.tasaEA}', interes_extra_inv = '${req.body.interesExtra}', interes_cop_inv = '${req.body.interesCop}', renta_extra_inv = ${req.body.rentaExtra}, renta_cop_inv = ${req.body.rentaCop}, pais_inv = '${req.body.pais}', descripcion_inv = '${req.body.descripcion}', estado_inv = ${req.body.estado}              
                WHERE id_inv = '${req.body.idInversion}' `;
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
                msg: 'Unable to update project. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Successfully updated project.',
                result
            });
        }
    });
});
/**
 * Método PUT para actualizar anexos
 */
router.put('/api/updateAnexo', middleware.validarJWT, (req, res) => {
    const query = `
                UPDATE anexos_inversiones
                SET movimiento_anex = '${req.body.movimiento}', capital_extra_anex = ${req.body.capitalExtra}, capital_cop_anex = ${req.body.capitalCop}, interes_extra_anex = '${req.body.interesExtra}', interes_cop_anex = '${req.body.interesCop}', capital_interes_extra_anex = ${req.body.capiInterExtra}, capital_interes_cop_anex = ${req.body.capiInterCop}, descripcion_anex = '${req.body.comentario}'
                WHERE id_inv = '${req.body.idInversion}' `;
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
                msg: 'It is not possible to update the annex. Please try again later.',
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: 'Annex successfully updated.',
                result
            });
        }
    });
});
/*******************************************************************************************/
/*********** MÉTODOS DELETE ************/
/*******************************************************************************************/
/**
 * Método para eliminar tickets por id
 */
router.delete('/api/deleteticket/:ticket', middleware.validarJWT, (req, res) => {
    const escapeTick = mysql_1.default.instance.cnn.escape(req.params.ticket);
    const query = `DELETE FROM tickets_clientes WHERE id_tic = ${escapeTick}`;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            res.status(400).send({
                ok: false,
                msg: `It is not possible to delete the ticket ${escapeTick}. Please try again later.`,
                error: err
            });
        }
        else {
            res.status(200).send({
                ok: true,
                msg: `The ticket ${escapeTick} was successfully removed.`,
                result
            });
        }
    });
});
/**
 * Método para eliminar archivos por id
 */
router.delete('/api/deletearchivo/:extension/:archivo/:id', [middleware.validarJWT, upload_1.default.deleteFile], (req, res) => {
    const escapeId = mysql_1.default.instance.cnn.escape(req.params.id);
    const query = `DELETE FROM informacion_clientes 
                 WHERE id_info = ${escapeId} `;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                msg: `The file cannot be deleted. Please try again later.`,
                error: err
            });
        }
        else {
            return res.status(200).send({
                ok: true,
                msg: `The file was deleted successfully.`,
                result
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
