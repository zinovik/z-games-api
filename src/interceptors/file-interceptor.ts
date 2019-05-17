import * as uuid from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExecutionContext, CallHandler } from '@nestjs/common';
// import * as cloudinary from 'cloudinary';
// import * as cloudinaryStorage from 'multer-storage-cloudinary';

/* tslint:disable */
const cloudinary = require('cloudinary');
const multerCloudinaryStorage = require('multer-storage-cloudinary');
/* tslint:enable */

import { InvalidFileException } from '../exceptions';

const localOptions = {
  storage: multerCloudinaryStorage({
    cloudinary,
    folder: 'z-games-avatars',
    allowedFormats: ['jpg', 'png', 'gif'],
    filename: (req: Request, file: File, callback: any) => callback(undefined, uuid.v1()),
  }),
};

export class FileUploadInterceptor extends FileInterceptor('file', localOptions) {

  constructor() {
    super();

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    try {
      return await super.intercept(context, next);
    } catch (error) {
      throw new InvalidFileException(error.message);
    }
  }
}
