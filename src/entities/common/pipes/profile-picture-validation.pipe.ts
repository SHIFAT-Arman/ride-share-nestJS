import {
  BadRequestException,
  Injectable,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

@Injectable()
export class ProfilePictureValidationPipe implements PipeTransform<Express.Multer.File> {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Profile picture file is required.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `File type '${file.mimetype}' is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}.`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 2 MB limit.');
    }

    return file;
  }
}
