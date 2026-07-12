import {
  PrismaClient,
  Role,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  LicenseCategory,
  TripStatus,
  MaintenanceStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding TransitOps...')

  // ── Wipe in dependency order ──────────────────────────────
  await prisma.expense.deleteMany()
  await prisma.fuelLog.deleteMany()
  await prisma.maintenanceLog.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()
  await prisma.settings.deleteMany()

  // ── Settings ──────────────────────────────────────────────
  await prisma.settings.create({
    data: { depotName: 'Gandhinagar Depot G24', currency: 'INR (Rs)', distanceUnit: 'Kilometers' },
  })

  // ── Users ─────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hashSync(p, 10)

  await prisma.user.createMany({
    data: [
      { name: 'Super Admin',   email: 'admin@transitops.in',    password: hash('admin123'),    role: Role.ADMIN },
      { name: 'Fleet Admin',   email: 'fleet@transitops.in',    password: hash('fleet123'),    role: Role.FLEET_MANAGER },
      { name: 'Raven K.',      email: 'dispatch@transitops.in', password: hash('dispatch123'), role: Role.DISPATCHER },
      { name: 'Safety Sam',    email: 'safety@transitops.in',   password: hash('safety123'),   role: Role.SAFETY_OFFICER },
      { name: 'Finance Fiona', email: 'finance@transitops.in',  password: hash('finance123'),  role: Role.FINANCIAL_ANALYST },
    ],
  })

  // ── Vehicles ──────────────────────────────────────────────
  const van05 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB452', nameModel: 'VAN-05', type: VehicleType.VAN,
      maxLoadCapacity: 500, odometer: 74000, acquisitionCost: 620000,
      status: VehicleStatus.AVAILABLE,
    },
  })

  const truck11 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB998', nameModel: 'TRUCK-11', type: VehicleType.TRUCK,
      maxLoadCapacity: 5000, odometer: 182000, acquisitionCost: 2450000,
      status: VehicleStatus.ON_TRIP,
    },
  })

  const mini03 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB120', nameModel: 'MINI-03', type: VehicleType.MINI,
      maxLoadCapacity: 1000, odometer: 51000, acquisitionCost: 410000,
      status: VehicleStatus.IN_SHOP,
    },
  })

  await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB008', nameModel: 'VAN-09', type: VehicleType.VAN,
      maxLoadCapacity: 750, odometer: 241900, acquisitionCost: 590000,
      status: VehicleStatus.RETIRED,
    },
  })

  // ── Drivers ───────────────────────────────────────────────
  const alex = await prisma.driver.create({
    data: {
      name: 'Alex', licenseNo: 'DL-88213', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2027-06-01'), contactNumber: '98765xxxxx',
      safetyScore: 96, tripsCompleted: 45, status: DriverStatus.AVAILABLE,
    },
  })

  await prisma.driver.create({
    data: {
      name: 'John', licenseNo: 'DL-44120', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2025-03-01'), // EXPIRED — rule 3 demo
      contactNumber: '98220xxxxx',
      safetyScore: 81, tripsCompleted: 22, status: DriverStatus.SUSPENDED,
    },
  })

  await prisma.driver.create({
    data: {
      name: 'Priya', licenseNo: 'DL-77031', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2026-09-01'), contactNumber: '9910xxxxx',
      safetyScore: 99, tripsCompleted: 61, status: DriverStatus.ON_TRIP,
    },
  })

  await prisma.driver.create({
    data: {
      name: 'Suresh', licenseNo: 'DL-40045', licenseCategory: LicenseCategory.HMV,
      licenseExpiry: new Date('2027-01-01'), contactNumber: '97440xxxxx',
      safetyScore: 88, tripsCompleted: 33, status: DriverStatus.OFF_DUTY,
    },
  })

  // ── Trips ─────────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub',
      vehicleId: van05.id, driverId: alex.id,
      cargoWeight: 450, plannedDistance: 35,
      status: TripStatus.DISPATCHED,
      revenue: 8000,
      eta: new Date(Date.now() + 45 * 60 * 1000),
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Vatva Industrial Area', destination: 'Sanand Warehouse',
      vehicleId: truck11.id, driverId: alex.id,
      cargoWeight: 3200, plannedDistance: 28,
      status: TripStatus.DISPATCHED,
      revenue: 22000,
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Mansa', destination: 'Kalol Depot',
      vehicleId: van05.id, driverId: alex.id,
      cargoWeight: 200, plannedDistance: 18,
      status: TripStatus.DRAFT,
      revenue: 4000,
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Gandhinagar', destination: 'Bopal',
      vehicleId: van05.id, driverId: alex.id,
      cargoWeight: 320, plannedDistance: 22,
      status: TripStatus.COMPLETED,
      finalOdometer: 74022, fuelConsumed: 4.2,
      revenue: 6500,
    },
  })

  // ── Maintenance Logs ──────────────────────────────────────
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: mini03.id, serviceType: 'Tyre Replace',
      cost: 6200, date: new Date('2026-07-07'),
      status: MaintenanceStatus.ACTIVE,
    },
  })

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: truck11.id, serviceType: 'Engine Repair',
      cost: 19000, date: new Date('2026-06-06'),
      status: MaintenanceStatus.COMPLETED,
    },
  })

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van05.id, serviceType: 'Oil Change',
      cost: 2500, date: new Date('2026-07-07'),
      status: MaintenanceStatus.ACTIVE,
    },
  })

  // ── Fuel Logs ─────────────────────────────────────────────
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: van05.id,   tripId: trip1.id, date: new Date('2026-07-05'), liters: 42,  cost: 3150 },
      { vehicleId: truck11.id,                   date: new Date('2026-07-06'), liters: 110, cost: 8400 },
      { vehicleId: mini03.id,                    date: new Date('2026-07-06'), liters: 28,  cost: 2050 },
    ],
  })

  // ── Expenses ──────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { vehicleId: van05.id,   tripId: trip1.id, toll: 120, other: 0,   total: 120 },
      { vehicleId: truck11.id,                   toll: 340, other: 150, total: 490 },
    ],
  })

  console.log('Seed complete.')
  console.log('')
  console.log('Test accounts:')
  console.log('  fleet@transitops.in    / fleet123')
  console.log('  dispatch@transitops.in / dispatch123')
  console.log('  safety@transitops.in   / safety123')
  console.log('  finance@transitops.in  / finance123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
