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
        (nombres_us, apellidos_us, email_us, password_us, telefono_us, compania_us, descripcion_us, fecha_reg_us, estado_us, admin_us)
        VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${password}', '${req.body.telefono}', '${req.body.compania}', '${req.body.descripcion}', CURRENT_TIMESTAMP(), 1, 'N' )`;
        
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
      res.status(200).send({
        ok: true,
        usuarios
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

  const query = ` SELECT * FROM tickets_clientes`;

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
 *Método GET que obtiene la imagen
 */
router.get('/api/getimagen/:extension/:imagen', middleware.validarJWT, ( req: Request, res: Response ) =>{

  FileUploads.retornaImagen
});







/*******************************************************************************************/
/*********** MÉTODOS PUT ************/
/*******************************************************************************************/

/**
 * Método POST para actualizar cliente por id
 */
router.put('/api/updateCliente', middleware.validarJWT, (req: Request, res: Response ) =>{
  
  const query = `
                UPDATE usuarios
                SET nombres_us = '${req.body.nombres}', apellidos_us = '${req.body.apellidos}', email_us = '${req.body.email}', telefono_us = '${req.body.telefono}', compania_us = '${req.body.compania}', descripcion_us = '${req.body.descripcion}', estado_us = ${req.body.estado}
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
 * Método POST para cargar archivos del cliente
 */
router.put('/api/uploadfile/:extension/:id', [middleware.validarJWT, FileUploads.uploadsFile],  async(req: Request, res: Response) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);
  const escapeExten = MySQL.instance.cnn.escape(req.params.extension);
  
  if ( FileUploads.upFile ) {

    const query = `
            INSERT INTO informacion_clientes
            (id_us_info, nom_archivo_info, tipo_archivo_info, fech_publica_info )
            VALUES ( ${escapeId}, '${FileUploads.nomDocumento}', ${escapeExten}, CURRENT_TIMESTAMP() )`;
        
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




/*******************************************************************************************/
/*********** MÉTODOS DELETE ************/
/*******************************************************************************************/

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