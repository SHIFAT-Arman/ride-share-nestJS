import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { IStorageService } from './storage.interface';
import { objectKeyFromPublicUrl } from './object-key';

@Injectable()
export class StorageService implements IStorageService {
  private readonly s3: S3Client;
  private readonly endpoint: string;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('NEON_AVATARS_BUCKET') ?? 'avatars';
    this.endpoint = config
      .getOrThrow<string>('AWS_ENDPOINT_URL_S3')
      .replace(/\/$/, '');
    // Neon Object Storage: path-style + env AWS_* credentials.
    this.s3 = new S3Client({ forcePathStyle: true });
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${randomUUID()}${extname(file.originalname)}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to save the uploaded file.',
      );
    }
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async delete(fileUrl: string): Promise<void> {
    // Legacy local-disk paths — nothing to delete in object storage.
    if (fileUrl.startsWith('/uploads/')) return;
    try {
      const key = objectKeyFromPublicUrl(fileUrl, this.endpoint, this.bucket);
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      // Missing object or foreign URL — ignore.
    }
  }
}
