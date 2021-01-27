import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
const { v4: uuidv4 } = require('uuid');




export default class FileUploads {

  //Atributos de la clase
  static nomDocumento: any;
  static upFile:boolean = false;
  static extenFile:String = 'pdf';

  constructor(){}


  //Métodos de la clase

  //Método para cargar imagen
  public static uploadsFile = async( req:Request, res:Response, next:any ) =>{

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

    if( extension !== 'pdf' ){
      FileUploads.extenFile = 'word';
    } 


    //Generar nombre archivo
    let nomArchivo:any = uuidv4();
    nomArchivo = nomArchivo.split('-');
    nomArchivo = `${nomArchivo[0]}-${file.name}`; 
    FileUploads.nomDocumento = await nomArchivo;


    //Path para guardar el archivo
    const path = `./files/${FileUploads.extenFile}/${nomArchivo}`;
    
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




  //Método para mostrar el archivo
  public static returnFile = (req:Request, res:Response) =>{
    const archivo = req.params.archivo;
    const extension = req.params.extension;

    const pathFile = path.join( __dirname, `../../files/${extension}/${archivo}` );
    
    //Archivo por defecto
    if (fs.existsSync( pathFile ) ) {

      return res.status(200).send({
        ok: true,
        pathFile
      })

      res.sendFile( pathFile );
      
    } else {
      const pathFile = path.join( __dirname, `../../files/file-malo.png` );
      return res.status(400).send({
        ok: false,
        pathFile
      })

      res.sendFile( pathFile );
      
    }

  }


  //Método para eliminar el archivo
  public static deleteFile = async(req:Request, res:Response, next:any) =>{

    const extension = req.params.extension;
    const archivo = req.params.archivo;

    const pathFile = path.join( __dirname, `../../files/${extension}/${archivo}` );

    try {
      await fs.unlinkSync( pathFile );
      next();
      
    } catch (err) {
      return res.status(400).send({
        ok: false,
        msg: `No es posible eliminar el archivo. Inténtelo más tarde.`,
        error: err
      });
      
    }

  }






}