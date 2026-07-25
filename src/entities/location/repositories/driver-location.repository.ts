// repositories/driver-location.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DriverLocation } from '../model/driver-location.entity';

@Injectable()
export class DriverLocationRepository {
  constructor(
    @InjectRepository(DriverLocation)
    private readonly repository: Repository<DriverLocation>,
    private readonly dataSource: DataSource,
  ) {}

  async saveLocation(
    driverId: number,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.repository.upsert(
      {
        driverId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
        },
        updatedAt: new Date(),
        isOnline: true,
      },
      ['driverId'],
    );
  }

  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
  ) {
    return this.dataSource.query(
      `
      SELECT *,
             ST_Distance(
                 location,
                 ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
             ) AS distance
      FROM driver_locations
      WHERE
          is_online = true
      AND
          ST_DWithin(
              location,
              ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
              $3
          )
      ORDER BY distance ASC;
      `,
      [longitude, latitude, radiusInMeters],
    );
  }
}
