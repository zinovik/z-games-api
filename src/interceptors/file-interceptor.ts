// // import * as uuid from 'uuid';
// import { FileInterceptor } from '@nestjs/platform-express';
// // import * as cloudinary from 'cloudinary';
// // import * as cloudinaryStorage from 'multer-storage-cloudinary';

// import { InvalidFileError } from '../exceptions';

// const localOptions = {
//   // storage: cloudinaryStorage({
//   //   cloudinary,
//   //   folder: 'avatars',
//   //   allowedFormats: ['jpg', 'png', 'gif'],
//   //   filename: (req: Request, file: File, callback: any) => callback(undefined, uuid.v1()),
//   // }),
// };

// export class FileUploadInterceptor extends FileInterceptor('file', localOptions) {

//   constructor() {
//     super();

//     // cloudinary.config({
//     //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     //   api_key: process.env.CLOUDINARY_API_KEY,
//     //   api_secret: process.env.CLOUDINARY_API_SECRET,
//     // });
//   }

//   async intercept(...args: any) {
//     try {
//       return await super.intercept(...args);
//     } catch (error) {
//       throw new InvalidFileError(error.message);
//     }
//   }
// }
