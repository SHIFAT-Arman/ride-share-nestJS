import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IStorageService } from './storage.interface';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { extname, join, resolve, sep } from 'path';

/** Resolve a stored upload URL under cwd/uploads; reject path traversal. */
export function resolveUploadPath(fileUrl: string): string {
  const uploadRoot = resolve(process.cwd(), 'uploads');
  const resolved = resolve(process.cwd(), fileUrl.replace(/^\/+/, ''));
  if (resolved !== uploadRoot && !resolved.startsWith(uploadRoot + sep)) {
    throw new BadRequestException('Invalid file path');
  }
  return resolved;
}

@Injectable()
export class StorageService implements IStorageService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = join(this.uploadRoot, folder);

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const ext = extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const filePath = join(uploadDir, filename);

    try {
      await writeFile(filePath, file.buffer);
    } catch {
      throw new InternalServerErrorException(
        'Failed to save the uploaded file.',
      );
    }

    return `/uploads/${folder}/${filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const filePath = resolveUploadPath(fileUrl);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist on disk (e.g. already deleted); silently ignore.
    }
  }
}
