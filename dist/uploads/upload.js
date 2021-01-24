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
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
class FileUploads {
    constructor() { }
}
exports.default = FileUploads;
FileUploads.upFile = false;
//Métodos de la clase
FileUploads.uploadsFile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const exten = req.params.extension;
    //Validar que exista un archivo
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({
            ok: false,
            msg: 'No hay archivo para subir',
        });
    }
    //Procesar la imagen
    const file = req.files.archivo;
    const nomCortado = file.name.split('.');
    const extension = nomCortado[nomCortado.length - 1];
    //Validar extensión
    const extenValidas = ['pdf', 'docx'];
    if (!extenValidas.includes(extension)) {
        return res.status(400).send({
            ok: false,
            msg: 'El tipo de archivo no es valido.',
        });
    }
    //Generar nombre archivo
    let nomArchivo = uuidv4();
    nomArchivo = nomArchivo.split('-');
    nomArchivo = `${nomArchivo[0]}-${file.name}`;
    FileUploads.nomDocumento = yield nomArchivo;
    //Path para guardar el archivo
    const path = `./files/${exten}/${nomArchivo}`;
    //Mover el archivo
    yield file.mv(path, (err) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                msg: 'No se pudo subir el archivo',
                err
            });
        }
        FileUploads.upFile = true;
        next();
    });
});
