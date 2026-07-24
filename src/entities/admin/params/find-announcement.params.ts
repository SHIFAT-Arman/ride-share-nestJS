import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationParams } from 'src/entities/common/pagination/pagination.params';

export class FindAnnouncementParams extends PaginationParams {
  @IsOptional()
  @IsUUID()
  adminProfileId: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  createdAt: Date;
}
