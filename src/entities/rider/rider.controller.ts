import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RiderService } from './rider.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { ProfilePictureValidationPipe } from '../common/pipes/profile-picture-validation.pipe';
import { Rider } from './rider.entity';
// import { FindRiderParams } from './param/find-rider.params';
import { PaginationParams } from '../common/pagination/pagination.params';
import { PaginationResponse } from '../common/pagination/pagination.response';

@Controller('/v1/api/rider')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Get()
  public async getAllRiders(
    // @Query() filter: FindRiderParams,
    @Query() pagination: PaginationParams,
  ): Promise<PaginationResponse<Rider>> {
    const [items, count] = await this.riderService.getAllRiders(pagination);

    return {
      data: items,
      meta: {
        total: count,
        limit: pagination.limit,
        offset: pagination.offset,
      },
    };
  }

  @Get('/search')
  public searchRiders(
    @Query('id') id: string,
    @Query('name') name: string,
  ): object {
    return this.riderService.searchRiderByIdAndName(id, name);
  }

  @Get('/ratings')
  public getRiderRatings(@Param('id') id: string): object {
    return this.riderService.getRiderRatings(id);
  }

  @Get('/profile/:id')
  public getRiderProfileById(@Param('id') id: string): object {
    return this.riderService.getRiderProfileById(id);
  }

  @Get('/:id')
  public getRiderById(@Param('id') id: string): object {
    return this.riderService.getRiderById(id);
  }

  @Get('/:id/profile')
  public getProfileById(@Param('id') id: string): object {
    return this.riderService.getProfileById(id);
  }

  @Get('/:id/rides')
  public getRidesById(@Param('id') id: string): object {
    return this.riderService.getRidesById(id);
  }

  @Get('/:id/payment-methods')
  public getPaymentMethodsById(@Param('id') id: string): object {
    return this.riderService.getPaymentMethodsById(id);
  }

  @Get('/:id/saved-places')
  public getSavedPlacesById(@Param('id') id: string): object {
    return this.riderService.getSavedPlacesById(id);
  }

  @Put('/:id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.riderService.uploadProfilePicture(id, file);
  }
}
