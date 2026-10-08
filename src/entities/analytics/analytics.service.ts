import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserType } from 'src/auth/user-type.enum';
import { Admin } from '../admin/admin.entity';
import { Driver } from '../driver/driver.entity';
import { DriverStatus } from '../driver/enums/driver-status.enum';
import { DriverLocation } from '../location/model/driver-location.entity';
import { Rating } from '../rating/rating.entity';
import { Rider } from '../rider/rider.entity';
import { RiderStatus } from '../rider/enums/rider-status.enum';
import { Ride } from '../ride/ride.entity';
import { RideStatus } from '../ride/enums/ride-status.enum';
import {
  cancellationRate,
  completionRate,
  ratedShare,
} from './analytics-rates';

export type AnalyticsRange = '7d' | '30d' | 'all';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Ride)
    private readonly rides: Repository<Ride>,
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    @InjectRepository(Rider)
    private readonly riders: Repository<Rider>,
    @InjectRepository(Driver)
    private readonly drivers: Repository<Driver>,
    @InjectRepository(DriverLocation)
    private readonly driverLocations: Repository<DriverLocation>,
    @InjectRepository(Rating)
    private readonly ratings: Repository<Rating>,
  ) {}

  async admin(rangeParam?: string) {
    const { range, from, to } = resolveRange(rangeParam);
    const base = () => this.rideQb(from, to);

    const [
      totalRides,
      completedRides,
      cancelledRides,
      gmvRow,
      onlineDrivers,
      pendingDriverVerifications,
      pendingRiderVerifications,
      searchingRides,
      dayRows,
      statusRows,
      mixRows,
      ratingAgg,
      distRows,
      adminCount,
      riderCount,
      driverCount,
    ] = await Promise.all([
      base().getCount(),
      base().andWhere('ride.status = :s', { s: RideStatus.COMPLETED }).getCount(),
      base().andWhere('ride.status = :s', { s: RideStatus.CANCELLED }).getCount(),
      base()
        .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
        .select('COALESCE(SUM(COALESCE(ride.estimatedFare, 0)), 0)', 'gmv')
        .getRawOne<{ gmv: string }>(),
      this.driverLocations.count({ where: { isOnline: true } }),
      this.drivers.count({
        where: { status: DriverStatus.PENDING_VERIFICATION },
      }),
      this.riders.count({
        where: { status: RiderStatus.PENDING_VERIFICATION },
      }),
      this.rides.count({ where: { status: RideStatus.SEARCHING } }),
      this.groupByDay(base()),
      base()
        .select('ride.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('ride.status')
        .getRawMany<{ status: string; count: string }>(),
      base()
        .select('ride.vehicleType', 'vehicleType')
        .addSelect('COUNT(*)', 'count')
        .addSelect(
          `COALESCE(SUM(CASE WHEN ride.status = :completed THEN COALESCE(ride.estimatedFare, 0) ELSE 0 END), 0)`,
          'estimatedFare',
        )
        .setParameter('completed', RideStatus.COMPLETED)
        .groupBy('ride.vehicleType')
        .getRawMany<{
          vehicleType: string;
          count: string;
          estimatedFare: string;
        }>(),
      this.ratingQb(from, to)
        .select('AVG(rating.score)', 'avg')
        .addSelect('COUNT(rating.id)', 'count')
        .getRawOne<{ avg: string | null; count: string }>(),
      this.ratingQb(from, to)
        .select('rating.score', 'score')
        .addSelect('COUNT(*)', 'count')
        .groupBy('rating.score')
        .getRawMany<{ score: string; count: string }>(),
      this.admins.count(),
      this.riders.count(),
      this.drivers.count(),
    ]);

    const ratingCount = Number(ratingAgg?.count ?? 0);

    return {
      range,
      from: from?.toISOString() ?? null,
      to: to.toISOString(),
      kpis: {
        totalRides,
        completedRides,
        cancelledRides,
        completionRate: completionRate(completedRides, cancelledRides),
        cancellationRate: cancellationRate(completedRides, cancelledRides),
        estimatedGmv: Number(gmvRow?.gmv ?? 0),
        onlineDrivers,
        pendingDriverVerifications,
        pendingRiderVerifications,
        searchingRides,
      },
      ridesByDay: fillDays(from, to, dayRows),
      ridesByStatus: statusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      vehicleMix: mixRows.map((r) => ({
        vehicleType: r.vehicleType,
        count: Number(r.count),
        estimatedFare: Number(r.estimatedFare),
      })),
      ratingHealth: {
        averageScore:
          ratingCount === 0 || ratingAgg?.avg == null
            ? null
            : Number(ratingAgg.avg),
        ratingCount,
        ratedShare: ratedShare(ratingCount, completedRides),
        distribution: fillScoreDistribution(distRows),
      },
      accounts: {
        admin: adminCount,
        rider: riderCount,
        driver: driverCount,
      },
    };
  }

  async me(userId: string, role: string, rangeParam?: string) {
    const { range, from, to } = resolveRange(rangeParam);
    if (role === UserType.DRIVER) {
      return this.driverMe(userId, range, from, to);
    }
    return this.riderMe(userId, range, from, to);
  }

  private async riderMe(
    userId: string,
    range: AnalyticsRange,
    from: Date | null,
    to: Date,
  ) {
    const base = () =>
      this.rideQb(from, to).andWhere('ride.riderUserId = :userId', { userId });

    const [
      completedRides,
      cancelledRides,
      spendRow,
      avgDistRow,
      avgDurRow,
      dayRows,
      mixRows,
    ] = await Promise.all([
      base().andWhere('ride.status = :s', { s: RideStatus.COMPLETED }).getCount(),
      base().andWhere('ride.status = :s', { s: RideStatus.CANCELLED }).getCount(),
      base()
        .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
        .select('COALESCE(SUM(COALESCE(ride.estimatedFare, 0)), 0)', 'spend')
        .getRawOne<{ spend: string }>(),
      base()
        .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
        .andWhere('ride.estimatedDistanceInKm IS NOT NULL')
        .select('AVG(ride.estimatedDistanceInKm)', 'avg')
        .getRawOne<{ avg: string | null }>(),
      base()
        .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
        .andWhere('ride.estimatedDurationInMinutes IS NOT NULL')
        .select('AVG(ride.estimatedDurationInMinutes)', 'avg')
        .getRawOne<{ avg: string | null }>(),
      this.groupByDay(base()),
      base()
        .select('ride.vehicleType', 'vehicleType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('ride.vehicleType')
        .getRawMany<{ vehicleType: string; count: string }>(),
    ]);

    return {
      range,
      from: from?.toISOString() ?? null,
      to: to.toISOString(),
      role: 'rider' as const,
      kpis: {
        completedRides,
        cancelledRides,
        estimatedSpend: Number(spendRow?.spend ?? 0),
        avgDistanceKm: avgDistRow?.avg == null ? null : Number(avgDistRow.avg),
        avgDurationMin: avgDurRow?.avg == null ? null : Number(avgDurRow.avg),
      },
      ridesByDay: fillDays(from, to, dayRows),
      vehicleMix: mixRows.map((r) => ({
        vehicleType: r.vehicleType,
        count: Number(r.count),
      })),
    };
  }

  private async driverMe(
    userId: string,
    range: AnalyticsRange,
    from: Date | null,
    to: Date,
  ) {
    const base = () =>
      this.rideQb(from, to).andWhere('ride.driverUserId = :userId', { userId });

    const [completedRides, cancelledRides, earnRow, dayRows, ratingRow] =
      await Promise.all([
        base()
          .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
          .getCount(),
        base()
          .andWhere('ride.status = :s', { s: RideStatus.CANCELLED })
          .getCount(),
        base()
          .andWhere('ride.status = :s', { s: RideStatus.COMPLETED })
          .select('COALESCE(SUM(COALESCE(ride.estimatedFare, 0)), 0)', 'earn')
          .getRawOne<{ earn: string }>(),
        this.groupByDayWithEarnings(base()),
        this.ratings
          .createQueryBuilder('rating')
          .innerJoin('rating.driver', 'driver')
          .where('driver.id = :userId', { userId })
          .select('AVG(rating.score)', 'avg')
          .addSelect('COUNT(rating.id)', 'count')
          .getRawOne<{ avg: string | null; count: string }>(),
      ]);

    const ratingCount = Number(ratingRow?.count ?? 0);

    return {
      range,
      from: from?.toISOString() ?? null,
      to: to.toISOString(),
      role: 'driver' as const,
      kpis: {
        completedRides,
        cancelledRides,
        estimatedEarnings: Number(earnRow?.earn ?? 0),
        averageRating:
          ratingCount === 0 || ratingRow?.avg == null
            ? null
            : Number(ratingRow.avg),
        ratingCount,
      },
      ridesByDay: fillDaysWithEarnings(from, to, dayRows),
    };
  }

  private rideQb(
    from: Date | null,
    to: Date,
  ): SelectQueryBuilder<Ride> {
    const qb = this.rides.createQueryBuilder('ride');
    if (from) {
      qb.andWhere('ride.createdAt >= :from', { from });
      qb.andWhere('ride.createdAt <= :to', { to });
    }
    return qb;
  }

  private ratingQb(from: Date | null, to: Date) {
    const qb = this.ratings.createQueryBuilder('rating');
    if (from) {
      qb.andWhere('rating.createdAt >= :from', { from });
      qb.andWhere('rating.createdAt <= :to', { to });
    }
    return qb;
  }

  private groupByDay(qb: SelectQueryBuilder<Ride>) {
    return qb
      .select(`TO_CHAR(ride.createdAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`TO_CHAR(ride.createdAt, 'YYYY-MM-DD')`)
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();
  }

  private groupByDayWithEarnings(qb: SelectQueryBuilder<Ride>) {
    return qb
      .select(`TO_CHAR(ride.createdAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `COALESCE(SUM(CASE WHEN ride.status = :completed THEN COALESCE(ride.estimatedFare, 0) ELSE 0 END), 0)`,
        'earnings',
      )
      .setParameter('completed', RideStatus.COMPLETED)
      .groupBy(`TO_CHAR(ride.createdAt, 'YYYY-MM-DD')`)
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string; earnings: string }>();
  }
}

function resolveRange(rangeParam?: string): {
  range: AnalyticsRange;
  from: Date | null;
  to: Date;
} {
  const to = new Date();
  const range: AnalyticsRange =
    rangeParam === '7d' || rangeParam === 'all' || rangeParam === '30d'
      ? rangeParam
      : '30d';
  if (range === 'all') return { range, from: null, to };
  const days = range === '7d' ? 7 : 30;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { range, from, to };
}

function fillDays(
  from: Date | null,
  to: Date,
  rows: { date: string; count: string }[],
): { date: string; count: number }[] {
  const counts = new Map(rows.map((r) => [r.date, Number(r.count)]));
  if (!from) {
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
  return eachDay(from, to).map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
}

function fillDaysWithEarnings(
  from: Date | null,
  to: Date,
  rows: { date: string; count: string; earnings: string }[],
): { date: string; count: number; earnings: number }[] {
  const map = new Map(
    rows.map((r) => [
      r.date,
      { count: Number(r.count), earnings: Number(r.earnings) },
    ]),
  );
  if (!from) {
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }
  return eachDay(from, to).map((date) => ({
    date,
    count: map.get(date)?.count ?? 0,
    earnings: map.get(date)?.earnings ?? 0,
  }));
}

function fillScoreDistribution(
  rows: { score: string; count: string }[],
): { score: number; count: number }[] {
  const counts = new Map(rows.map((r) => [Number(r.score), Number(r.count)]));
  return [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: counts.get(score) ?? 0,
  }));
}

function eachDay(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
