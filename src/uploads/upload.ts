import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
const { v4: uuidv4 } = require('uuid');




export default class FileUploads {

  //Atributos de la clase
  static nomDocumento: any;
  static upFile:boolean = false;

  constructor(){}


  //Métodos de la clase
  public static uploadsFile = async( req:Request, res:Response, next:any ) =>{

    const exten = req.params.extension;

    //Validar que exista un archivo
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({
        ok:false,
        msg: 'No hay archivo para subir',
      });
    }


    //Procesar la imagen
    const file:any = req.files.archivo;
    const nomCortado = file.name.split('.');
    const extension = nomCortado[ nomCortado.length -1 ];

    //Validar extensión
    const extenValidas = ['pdf', 'docx'];
    if ( !extenValidas.includes( extension ) ) {
      return res.status(400).send({
        ok:false,
        msg: 'El tipo de archivo no es valido.',
      });
    }


    //Generar nombre archivo
    let nomArchivo:any = uuidv4();
    nomArchivo = nomArchivo.split('-');
    nomArchivo = `${nomArchivo[0]}-${file.name}`; 
    FileUploads.nomDocumento = await nomArchivo;


    //Path para guardar el archivo
    const path = `./files/${exten}/${nomArchivo}`;
    
    //Mover el archivo
    await file.mv( path, (err:any) =>{
      if (err){
        return res.status(500).send({
          ok: false,
          msg: 'No se pudo subir el archivo',
          err
        });
      }

      FileUploads.upFile = true;
      next();
      
    });


  }


}