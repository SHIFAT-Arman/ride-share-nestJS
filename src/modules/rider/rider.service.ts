import { Injectable } from '@nestjs/common';

@Injectable()
export class RiderService {
  public getRiders(): object {
    return { id: 1, name: `Shifat`, longitude: 242, langtitude: 450 };
  }

  public getRiderById(id: string): object {
    return { id: `${id}`, name: `Arman`, longitude: 242, langtitude: 450 };
  }

  public getProfileById(id: string): object {
    return { id: `${id}`, name: `Shifat`, email: `shifatshiam@gmail.com` };
  }

  public getRidesById(id: string): object {
    return { id: `${id}`, rides: [] };
  }

  public getPaymentMethodsById(id: string): object {
    return { id: `${id}`, paymentMethods: [] };
  }

  public getSavedPlacesById(id: string): object {
    return { id: `${id}`, savedPlaces: [] };
  }

  public searchRiderByIdAndName(id: string, name: string): object {
    return { id: `${id}`, name: `${name}`, longitude: 242, langtitude: 450 };
  }

  public getRiderRatings(id: string): object {
    return { id: `${id}`, ratings: [{ driverId: 1, rating: 5 }] };
  }

  public getRiderProfileById(id: string): object {
    return { id: `${id}`, name: `Shifat`, email: `shifatshiam@gmail.com` };
  }
}
