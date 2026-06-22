import { Controller, Get, Param, Query } from '@nestjs/common';
import { RiderService } from './rider.service';

@Controller('/v1/api/riders')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Get()
  public getRiders(): object {
    return this.riderService.getRiders();
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
}
