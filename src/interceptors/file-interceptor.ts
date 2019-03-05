// import { FileInterceptor } from '@nestjs/common';
// import * as cloudinary from 'cloudinary';
// import * as cloudinaryStorage from 'multer-storage-cloudinary';
// import { v1 as uuid } from 'uuid';

// import { InvalidFileError } from './errors';

// const localOptions = {
//   storage: cloudinaryStorage({
//     cloudinary,
//     folder: 'avatars',
//     allowedFormats: ['jpg', 'png', 'gif'],
//     filename: (req, file, callback) => callback(undefined, uuid()),
//   }),
// };

// export class FileUploadInterceptor extends FileInterceptor('file', localOptions) {

//   constructor() {
//     super();

//     cloudinary.config({
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       api_key: process.env.CLOUDINARY_API_KEY,
//       api_secret: process.env.CLOUDINARY_API_SECRET,
//     });
//   }

//   async intercept(...args) {
//     try {
//       return await super.intercept(...args);
//     } catch (err) {
//       throw new InvalidFileError();
//     }
//   }
// }
