import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DriverLocation } from '../model/driver-location.entity';
import { VehicleType } from '../../vehicle/enums/vehicle-type.enum';

export type NearbyDriverRow = {
  driverId: string;
  distance: number;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
};

@Injectable()
export class DriverLocationRepository {
  constructor(
    @InjectRepository(DriverLocation)
    private readonly repository: Repository<DriverLocation>,
    private readonly dataSource: DataSource,
  ) {}

  async saveLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    isOnline = true,
  ): Promise<void> {
    await this.repository.upsert(
      {
        driverId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        updatedAt: new Date(),
        isOnline,
      },
      ['driverId'],
    );
  }

  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
    vehicleType?: VehicleType,
  ): Promise<NearbyDriverRow[]> {
    // TypeORM default column names are camelCase (no SnakeNamingStrategy).
    const params: unknown[] = [longitude, latitude, radiusInMeters];
    let vehicleFilter = '';
    if (vehicleType) {
      params.push(vehicleType);
      vehicleFilter = `AND v."vehicleType" = $4`;
    }

    return this.dataSource.query(
      `
      SELECT
        dl."driverId" AS "driverId",
        ST_Distance(
          dl.location,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
        ) AS distance,
        ST_Y(dl.location::geometry) AS latitude,
        ST_X(dl.location::geometry) AS longitude,
        v."vehicleType" AS "vehicleType"
      FROM driver_locations dl
      INNER JOIN vehicle v ON v."driverId" = dl."driverId"
      WHERE
        dl."isOnline" = true
        ${vehicleFilter}
        AND ST_DWithin(
          dl.location,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )
      ORDER BY distance ASC
      LIMIT 10
      `,
      params,
    );
  }
}
