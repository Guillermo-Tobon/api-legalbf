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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const { v4: uuidv4 } = require('uuid');
class FileUploads {
    constructor() { }
}
exports.default = FileUploads;
FileUploads.upFile = false;
FileUploads.extenFile = 'pdf';
//Métodos de la clase
//Método para cargar imagen
FileUploads.uploadsFile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    if (extension !== 'pdf') {
        FileUploads.extenFile = 'word';
    }
    //Generar nombre archivo
    let nomArchivo = uuidv4();
    nomArchivo = nomArchivo.split('-');
    nomArchivo = `${nomArchivo[0]}-${file.name}`;
    FileUploads.nomDocumento = yield nomArchivo;
    //Path para guardar el archivo
    const path = `./files/${FileUploads.extenFile}/${nomArchivo}`;
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
//Método para mostrar el archivo
FileUploads.returnFile = (req, res) => {
    const archivo = req.params.archivo;
    const extension = req.params.extension;
    const pathFile = path_1.default.join(__dirname, `../../files/${extension}/${archivo}`);
    //Archivo por defecto
    if (fs_1.default.existsSync(pathFile)) {
        return res.status(200).send({
            ok: true,
            pathFile
        });
        res.sendFile(pathFile);
    }
    else {
        const pathFile = path_1.default.join(__dirname, `../../files/file-malo.png`);
        return res.status(400).send({
            ok: false,
            pathFile
        });
        res.sendFile(pathFile);
    }
};
//Método para eliminar el archivo
FileUploads.deleteFile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const extension = req.params.extension;
    const archivo = req.params.archivo;
    const pathFile = path_1.default.join(__dirname, `../../files/${extension}/${archivo}`);
    try {
        yield fs_1.default.unlinkSync(pathFile);
        next();
    }
    catch (err) {
        return res.status(400).send({
            ok: false,
            msg: `The file cannot be deleted. Please try again later.`,
            error: err
        });
    }
});
