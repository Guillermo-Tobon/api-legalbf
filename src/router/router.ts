import { Router, Request, Response } from 'express';
import cron = require('node-cron');
import bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
import NodeMailer from '../nodemailer/config-nodemailer';

import MySQL from '../mysql/mysql';
import RouterValida from './router.validators';
import JsonWebToken from '../helpers/jwt';
import MiddlewareJWT from '../middlewares/validar-jwt';
import FileUploads from '../uploads/upload';

const routValida = new RouterValida();
const jwt = new JsonWebToken();
const middleware = new MiddlewareJWT();

const router = Router();

/*******************************************************************************************/
/*********** MÉTODOS POST ************/
/*******************************************************************************************/

/**
 * Método POST para insertar usuario nuevo
 */
router.post('/api/insertUsuario', async(req: Request, res: Response ) =>{

  await routValida.validarUsuario(req.body.email, (err:any, data:any ) =>{

    if(data){
      return res.status(400).send({ 
        ok: false, 
        msg: 'El usuario con este correo electrónico ya está registrado'
      }); 

    } 

    if ( err ) {
      if ( err == 'No hay registros.' ) {
        
        //Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        const password = bcrypt.hashSync( req.body.password, salt );
        
        const query = `
        INSERT INTO usuarios 
        (nombres_us, apellidos_us, email_us, password_us, telefono_us, pais_us, compania_us, descripcion_us, fecha_reg_us, estado_us, admin_us)
        VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${password}', '${req.body.telefono}', '${req.body.pais}', '${req.body.compania}', '${req.body.descripcion}', CURRENT_TIMESTAMP(), 1, 'N' )`;
        
        MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
          if ( err ) {
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
          })

        });


      } else {
        return res.status(400).send({
          ok: false,
          msg: 'Problema al consultar el usuario.',
          err
        })
      }
    }
    
  })
  
});



/**
 * Método POST para insertar inversiones 
 */
router.post('/api/insertInversion', middleware.validarJWT, (req: Request, res: Response ) =>{

  let idInver = uuidv4();
  idInver = idInver.split('-');

  const query = `INSERT INTO inversiones_clientes 
                 ( id_inv, id_us_inv, nombre_inv, capital_extra_inv, moneda_extra_inv, tasa_cambio_inv, capital_cop_inv, tiempo_inv, tasa_ea_inv, interes_extra_inv, interes_cop_inv, renta_extra_inv, renta_cop_inv, pais_inv, descripcion_inv, estado_inv, fechareg_inv )
                 VALUES ( '${idInver[0]}', ${req.body.idUs}, '${req.body.nombreInver}', ${req.body.capitalExtra}, '${req.body.monedaInver}', '${req.body.tasaCambio}', ${req.body.capitalCop}, ${req.body.tiempo}, '${req.body.tasaEA}', '${req.body.interesExtra}', '${req.body.interesCop}', ${req.body.rentaExtra}, ${req.body.rentaCop}, '${req.body.pais}', '${req.body.descripcion}', ${req.body.estado}, CURRENT_TIMESTAMP() ) `;

  MySQL.ejecutarQuery(query, (err: any, result: Object[]) => {
    if (err) {
      return res.status(400).send({
        ok: false,
        msg: 'Problema al crear la inversión.',
        err: query
      });

    }
    res.status(200).send({
      ok: true,
      msg: 'Inversión creada con éxito.',
      idInver: idInver[0],
      result
    });

  });


})




/**
 * Método POST para iniciar sesión
 */
router.post('/api/loginUser', (req: Request, res: Response ) =>{

  const { email, password } = req.body;
  const queryUs = `SELECT * FROM usuarios WHERE email_us = '${email}'`;

  try {

    MySQL.ejecutarQuery( queryUs, async(err:any, result:any) =>{
    
      if ( err ) {
        if ( err == 'No hay registros.' ) {
          
          return res.status(400).send({
            ok: false,
            err,
            msg: 'E-mail y/o password incorrectos.'
          })
  
        } else {
          return res.status(400).send({
            ok: false,
            err,
            msg: 'Error en la consulta de usuario. Intente más tarde.'
          })
        }
  
      } else {
  
        const passUser = bcrypt.compareSync( password,  result[0].password_us);
        if ( !passUser ) {
          return res.status(400).send({
            ok: false,
            err: 'Password incorrecto.',
            msg: 'E-mail y/o password son incorrectos.'
          })
  
        } else if( result[0].estado_us === 0 ){

          return res.status(400).send({
            ok: false,
            err: 'Acceso denegado.',
            msg: 'Su cuenta esta bloqueada. comuníquese con el administrador.'
          })
          
        } else {

          //Generar un token - JWT
          const token = await jwt.generarJWT( result[0].id_us, result[0].email_us );

          return res.status(200).send({
            ok: true,
            err,
            msg: 'Login correcto!',
            token
          })

        }
      }
  
    });
    
  } catch (error) {
    return res.status(500).send({
      ok: false,
      msg: 'Error inesperado en login... Revisar logs',
      error
    });
  }

});




/**
 * Método POST para insertar ticket nuevos
 */
router.post('/api/crearticket', middleware.validarJWT, async(req: Request, res: Response ) =>{
  
  //Primero consultamos si existe el ticket pendiente
  routValida.validarTicket(req.body.email, (err: any, data: any) => {

    if (data) {
      return res.status(400).send({
        ok: false,
        msg: `Tiene un ticket ( ${data[0].id_tic} ) pendiente de contestar. comuníquese con el administrador.`,
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

        MySQL.ejecutarQuery(query, (err: any, result: Object[]) => {
          if (err) {
            return res.status(400).send({
              ok: false,
              msg: 'Problema al crear el ticket.',
              err: query
            });

          }
          res.status(200).send({
            ok: true,
            msg: 'Ticket creado con éxito.',
            idticket: idTicket[0]
          });

        });

      } else {
        return res.status(400).send({
          ok: false,
          msg: 'Problema al consultar el ticket.',
          err
        });
      }
    }

  });
 
});




/**
 * Método POST para enviar correos
 */
router.post('/api/email', middleware.validarJWT, async(req: Request, res: Response ) =>{
  
  const nodemailer = new NodeMailer(req.body);
   await nodemailer.SendMailer(req, res);

});




/**
 * Método POST para insertar anexos 
 */
router.post('/api/insertAnexo', middleware.validarJWT, (req: Request, res: Response ) =>{

  let idAnexo = uuidv4();
  idAnexo = idAnexo.split('-');

  const query = `INSERT INTO anexos_inversiones 
                 ( id_anex, id_inv, id_us_inv, movimiento_anex, capital_extra_anex, capital_cop_anex, interes_extra_anex, interes_cop_anex, capital_interes_extra_anex, capital_interes_cop_anex, moneda_anex,  descripcion_anex, fechpublica_anex )
                 VALUES ( '${idAnexo[0]}', '${req.body.idInversion}', ${req.body.idUser}, '${req.body.movimiento}', ${req.body.capitalExtra}, ${req.body.capitalCop}, '${req.body.interesExtra}', '${req.body.interesCop}', ${req.body.capiInterExtra}, ${req.body.capiInterCop}, '${req.body.monedaAnex}', '${req.body.comentario}', '${req.body.fecha}' ) `;

  MySQL.ejecutarQuery(query, (err: any, result: Object[]) => {
    if (err) {
      return res.status(400).send({
        ok: false,
        msg: 'Problema al crear el anexo.',
        err: query
      });

    }
    return res.status(200).send({
      ok: true,
      msg: 'Anexo creado con éxito.',
      idAnexo: idAnexo[0],
      result
    });

  });

})






/*******************************************************************************************/
/*********** MÉTODOS GET ************/
/*******************************************************************************************/

/**
 * Método GET para validar en token de seguridad
 */
router.get('/api/loginrenew', middleware.validarJWT, ( req: Request, res: Response  ) =>{

  const token = req.header( 'x-token' );

  const query = `
                SELECT * 
                FROM usuarios 
                WHERE id_us = ${middleware.user.id} AND email_us = '${middleware.user.email}'`;
  
  MySQL.ejecutarQuery( query, (err:any, usuario: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Usuario valido.',
        token,
        usuario
      })
    }
  })

});




/**
 *Método GET que obtiene todos los usuarios administradores
 */
router.get('/api/usuarios', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = `SELECT * FROM usuarios WHERE id_us NOT IN (1)`;

  MySQL.ejecutarQuery( query, (err:any, usuarios: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        usuarios
      })
    }
  })

});



/**
 *Método GET que obtiene el usuario por id
 */
router.get('/api/usuarios/:idUser', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.idUser);

  const query = `SELECT * FROM usuarios WHERE id_us = ${escapeId} `;

  MySQL.ejecutarQuery( query, (err:any, usuario: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        usuario
      })
    }
  })

});



/**
 *Método GET que obtiene todos los clientes
 */
router.get('/api/clientes', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = `SELECT * FROM informacion_clientes`;

  MySQL.ejecutarQuery( query, (err:any, clientes: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        clientes
      })
    }
  })

});



/**
 *Método GET que obtiene todos los tickets
 */
router.get('/api/alltickets', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = ` SELECT * FROM tickets_clientes `;

  MySQL.ejecutarQuery( query, (err:any, tickets: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        msg: 'No es posible obtener los tickets. Inténtelo más tarde.',
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        tickets
      })
    }
  })

});



/**
 *Método GET que obtiene los tickets por id de usuario
 */
router.get('/api/tickets/:id', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);

  const query = `
                SELECT * 
                FROM tickets_clientes 
                WHERE id_cliente_tic = ${escapeId}`;

  MySQL.ejecutarQuery( query, (err:any, tickets: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        msg: 'No es posible obtener los tickets. Inténtelo más tarde.',
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        tickets
      })
    }
  })

});




/**
 *Método GET que obtiene las inversiones por id de usuario
 */
router.get('/api/inversiones', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = ` SELECT * FROM inversiones_clientes ORDER BY fechareg_inv DESC `;

  MySQL.ejecutarQuery( query, (err:any, inversiones: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        msg: 'No es posible obtener las inversiones. Inténtelo más tarde.',
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        inversiones
      })
    }
  })

})




/**
 *Método GET que obtiene las inversiones por id de usuario
 */
router.get('/api/inversiones/:id', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);

  const query = `
                SELECT * 
                FROM inversiones_clientes 
                WHERE id_us_inv = ${escapeId}`;

  MySQL.ejecutarQuery( query, (err:any, inversiones: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        msg: 'No es posible obtener las inversiones. Inténtelo más tarde.',
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        inversiones
      })
    }
  })

})



/**
 *Método GET que obtiene todos los archivos
 */
router.get('/api/archivos', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = ` SELECT T0.*, T1.nombres_us
                  FROM informacion_clientes AS T0 INNER JOIN usuarios AS T1 
                  ON id_us_info = id_us 
                  ORDER BY fech_publica_info DESC `;

  MySQL.ejecutarQuery( query, (err:any, archivos: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        archivos
      })
    }
  })

})



/**
 *Método GET que obtiene los archivos por id de usuario
 */
router.get('/api/archivos/:id', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);

  const query = ` SELECT * FROM informacion_clientes WHERE  id_us_info = ${escapeId}`;

  MySQL.ejecutarQuery( query, (err:any, archivos: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        archivos
      })
    }
  })

})



/**
 *Método GET que obtiene los archivos por id de usuario y id inversión
 */
router.get('/api/archivos/:idInversion/:id', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);
  const escapeInver = MySQL.instance.cnn.escape(req.params.idInversion);

  const query = ` SELECT * 
                  FROM informacion_clientes 
                  WHERE id_us_info = ${escapeId} AND id_inv = ${escapeInver}`;

  MySQL.ejecutarQuery( query, (err:any, archivos: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        archivos
      })
    }
  })

})




/**
 *Método GET que obtiene los anexos por id de inversión
 */
router.get('/api/anexos/:idInversion', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const escapeIdInver = MySQL.instance.cnn.escape(req.params.idInversion);

  const query = `
                SELECT T0.*, DATE_FORMAT(T0.fechpublica_anex, '%d-%m-%Y') AS fechAnexo, T1.nom_archivo_info, T1.tipo_archivo_info
                FROM anexos_inversiones as T0 INNER JOIN informacion_clientes AS T1 ON T0.id_anex = T1.id_anex
                WHERE T0.id_inv = ${escapeIdInver} ORDER BY T0.id_anex ASC `;


  MySQL.ejecutarQuery( query, (err:any, anexos: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        msg: 'No es posible obtener los anexos. Inténtelo más tarde.',
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        anexos
      })
    }
  })

})




/**
 *Método GET que obtiene la imagen
 */
router.get('/api/getarchivo/:extension/:archivo', middleware.validarJWT, ( req: Request, res: Response ) =>{

  FileUploads.returnFile(req, res);
});


/**
 *Método GET que obtiene los usuarios y sus inversiones
 */
router.get('/api/usuariosInversion', middleware.validarJWT, ( req: Request, res: Response ) =>{
  const query = `
                SELECT T0.id_us, T0.nombres_us, T0.compania_us, T0.email_us, T1.nombre_inv, T1.capital_inv, T1.moneda_inv, T1.tiempo_inv, T1.tasa_ea_inv  
                FROM usuarios AS T0 INNER JOIN  inversiones_clientes AS T1 ON T0.id_us = T1.id_us_inv
                WHERE T0.estado_us = 1 ORDER BY T0.id_us ASC`;  

  MySQL.ejecutarQuery( query, (err:any, datos: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        msg: 'No es posible obtener los anexos. Inténtelo más tarde.',
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        datos
      })
    }
  })

})







/*******************************************************************************************/
/*********** MÉTODOS PUT ************/
/*******************************************************************************************/

/**
 * Método PUT para actualizar cliente por id
 */
router.put('/api/updateCliente', middleware.validarJWT, (req: Request, res: Response ) =>{
  
  const query = `
                UPDATE usuarios
                SET nombres_us = '${req.body.nombres}', apellidos_us = '${req.body.apellidos}', email_us = '${req.body.email}', telefono_us = '${req.body.telefono}', pais_us = '${req.body.pais}', compania_us = '${req.body.compania}', descripcion_us = '${req.body.descripcion}', estado_us = ${req.body.estado}
                WHERE id_us = ${req.body.id} `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{
    
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible actualizar el cliente. Verifica los datos.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Cliente actualizado con éxito.',
        result
      });
    }


  });
  
});



/**
 * Método PUT para cargar archivos del cliente
 */
router.put('/api/uploadfile/:idInversion/:idAnexo/:id', [middleware.validarJWT, FileUploads.uploadsFile],  async(req: Request, res: Response) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);
  const escapeIdInver = MySQL.instance.cnn.escape(req.params.idInversion);
  const escapeIdAnex = MySQL.instance.cnn.escape(req.params.idAnexo);
  
  if ( FileUploads.upFile ) {

    const query = `
            INSERT INTO informacion_clientes
            (id_us_info, id_inv, id_anex, nom_archivo_info, tipo_archivo_info, fech_publica_info )
            VALUES ( ${escapeId}, ${escapeIdInver}, ${escapeIdAnex}, '${FileUploads.nomDocumento}', '${FileUploads.extenFile}', CURRENT_TIMESTAMP() )`;
        
    MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
      if ( err ) {
        return res.status(400).send({
          ok: false,
          msg: 'Problema al crear la información.',
          err
    
        });
        
      } 
      return res.status(200).send({
        ok: true,
        msg: 'Información registrada con éxito.',
        result
      })

    });
    
  }

  

  

})


/**
 * Método PUT para actualizar tickets por usuario
 */
router.put('/api/updateTicket', middleware.validarJWT, (req: Request, res: Response ) =>{

  const query = `
                UPDATE tickets_clientes
                SET asunto_tic = '${req.body.asunto}', mensaje_tic = '${req.body.mensaje}'
                WHERE id_tic = '${req.body.idTicket}' `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{

    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible actualizar el ticket. Inténtelo más tarde.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Ticket actualizado con éxito.',
        result
      });
    }


  });

})




/**
 * Método PUT para responder tickets por usuario
 */
router.put('/api/answerTicket', middleware.validarJWT, (req: Request, res: Response ) =>{

  const query = `
                UPDATE tickets_clientes
                SET respuesta_tic = '${req.body.respuesta}', estado_tic = 1
                WHERE id_tic = '${req.body.idTicket}' `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{

    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible responder el ticket. Inténtelo más tarde.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Ticket contestado con éxito.',
        result
      });
    }

  });

})




/**
 * Método PUT para actualizar la inversión
 */
router.put('/api/updateInversion', middleware.validarJWT, (req: Request, res: Response ) =>{

  const query = `
                UPDATE inversiones_clientes
                SET nombre_inv = '${req.body.nombreInver}', capital_extra_inv = ${req.body.capitalExtra}, moneda_extra_inv = '${req.body.monedaInver}', tasa_cambio_inv = '${req.body.tasaCambio}', capital_cop_inv = ${req.body.capitalCop}, tiempo_inv = ${req.body.tiempo}, tasa_ea_inv = '${req.body.tasaEA}', interes_extra_inv = '${req.body.interesExtra}', interes_cop_inv = '${req.body.interesCop}', renta_extra_inv = ${req.body.rentaExtra}, renta_cop_inv = ${req.body.rentaCop}, pais_inv = '${req.body.pais}', descripcion_inv = '${req.body.descripcion}', estado_inv = ${req.body.estado}              
                WHERE id_inv = '${req.body.idInversion}' `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{

    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible actualizar la inversión. Inténtelo más tarde.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Inversión actualizada con éxito.',
        result
      });
    }

  });

})



/**
 * Método PUT para actualizar anexos
 */
router.put('/api/updateAnexo', middleware.validarJWT, (req: Request, res: Response ) =>{

  const query = `
                UPDATE anexos_inversiones
                SET movimiento_anex = '${req.body.movimiento}', capital_extra_anex = ${req.body.capitalExtra}, capital_cop_anex = ${req.body.capitalCop}, interes_extra_anex = '${req.body.interesExtra}', interes_cop_anex = '${req.body.interesCop}', capital_interes_extra_anex = ${req.body.capiInterExtra}, capital_interes_cop_anex = ${req.body.capiInterCop}, descripcion_anex = '${req.body.comentario}'
                WHERE id_inv = '${req.body.idInversion}' `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{

    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible actualizar el anexo. Inténtelo más tarde.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Anexo actualizado con éxito.',
        result
      });
    }

  }); 

})



/*******************************************************************************************/
/*********** MÉTODOS DELETE ************/
/*******************************************************************************************/

/**
 * Método para eliminar tickets por id
 */
router.delete('/api/deleteticket/:ticket', middleware.validarJWT, (req: Request, res: Response ) =>{

  const escapeTick = MySQL.instance.cnn.escape(req.params.ticket);

  const query = `DELETE FROM tickets_clientes WHERE id_tic = ${escapeTick}`;

  MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        msg: `No es posible eliminar el ticket ${escapeTick}. Inténtelo más tarde.`,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        msg: `El ticket ${escapeTick} fue eliminado con éxito.`,
        result
      })
    }
  })

})



/**
 * Método para eliminar archivos por id
 */
router.delete('/api/deletearchivo/:extension/:archivo/:id', [middleware.validarJWT, FileUploads.deleteFile], (req: Request, res: Response ) =>{
 
  const escapeId = MySQL.instance.cnn.escape(req.params.id);

  const query = `DELETE FROM informacion_clientes 
                 WHERE id_info = ${escapeId} `;

  MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        msg: `No es posible eliminar el archivo. Inténtelo más tarde.`,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        msg: `El archivo fue eliminado con éxito.`,
        result
      })
    }
  })

})



//================================================================
//================================================================
/**
 * Método que mantiene la conexión de MySQL
 */
cron.schedule('*/3 * * * *', () =>{
  const hora = new Date().getTime();
  MySQL.ejecutarQuery('SELECT 1', (err:any, result:any) =>{
    if ( err ) {
      throw new Error("Error conexión");
    } else {
      console.log(`Conexión constante!! ${result} - ${hora}`);
    }
  });
});



export default router;