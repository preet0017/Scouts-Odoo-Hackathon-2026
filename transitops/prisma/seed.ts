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
      maxLoadCapacity: 500, odometer: 74200, acquisitionCost: 620000,
      status: VehicleStatus.AVAILABLE,
    },
  })

  const truck11 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB998', nameModel: 'TRUCK-11', type: VehicleType.TRUCK,
      maxLoadCapacity: 5000, odometer: 182400, acquisitionCost: 2450000,
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

  const van09 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01AB008', nameModel: 'VAN-09', type: VehicleType.VAN,
      maxLoadCapacity: 750, odometer: 241900, acquisitionCost: 590000,
      status: VehicleStatus.RETIRED,
    },
  })

  const truck07 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ05CD321', nameModel: 'TRUCK-07', type: VehicleType.TRUCK,
      maxLoadCapacity: 8000, odometer: 98500, acquisitionCost: 3200000,
      status: VehicleStatus.AVAILABLE,
    },
  })

  const mini08 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ05CD789', nameModel: 'MINI-08', type: VehicleType.MINI,
      maxLoadCapacity: 1200, odometer: 32100, acquisitionCost: 480000,
      status: VehicleStatus.AVAILABLE,
    },
  })

  const van12 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ01XZ441', nameModel: 'VAN-12', type: VehicleType.VAN,
      maxLoadCapacity: 600, odometer: 19800, acquisitionCost: 650000,
      status: VehicleStatus.ON_TRIP,
    },
  })

  const truck02 = await prisma.vehicle.create({
    data: {
      regNo: 'GJ03PQ112', nameModel: 'TRUCK-02', type: VehicleType.TRUCK,
      maxLoadCapacity: 6000, odometer: 310000, acquisitionCost: 2800000,
      status: VehicleStatus.AVAILABLE,
    },
  })

  // ── Drivers ───────────────────────────────────────────────
  const alex = await prisma.driver.create({
    data: {
      name: 'Alex Fernandez', licenseNo: 'DL-88213', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2027-06-01'), contactNumber: '9876543210',
      safetyScore: 96, tripsCompleted: 58, status: DriverStatus.AVAILABLE,
    },
  })

  const john = await prisma.driver.create({
    data: {
      name: 'John Dsouza', licenseNo: 'DL-44120', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2025-03-01'), // EXPIRED — rule 3 demo
      contactNumber: '9822012345',
      safetyScore: 71, tripsCompleted: 22, status: DriverStatus.SUSPENDED,
    },
  })

  const priya = await prisma.driver.create({
    data: {
      name: 'Priya Sharma', licenseNo: 'DL-77031', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2027-09-01'), contactNumber: '9910056789',
      safetyScore: 99, tripsCompleted: 74, status: DriverStatus.ON_TRIP,
    },
  })

  const suresh = await prisma.driver.create({
    data: {
      name: 'Suresh Patel', licenseNo: 'DL-40045', licenseCategory: LicenseCategory.HMV,
      licenseExpiry: new Date('2028-01-01'), contactNumber: '9744098765',
      safetyScore: 91, tripsCompleted: 47, status: DriverStatus.AVAILABLE,
    },
  })

  const meera = await prisma.driver.create({
    data: {
      name: 'Meera Joshi', licenseNo: 'DL-55901', licenseCategory: LicenseCategory.HMV,
      licenseExpiry: new Date('2026-11-15'), contactNumber: '9638527410',
      safetyScore: 87, tripsCompleted: 31, status: DriverStatus.ON_TRIP,
    },
  })

  const rajan = await prisma.driver.create({
    data: {
      name: 'Rajan Mehta', licenseNo: 'DL-62304', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2027-03-20'), contactNumber: '9512348670',
      safetyScore: 94, tripsCompleted: 39, status: DriverStatus.OFF_DUTY,
    },
  })

  const kavita = await prisma.driver.create({
    data: {
      name: 'Kavita Nair', licenseNo: 'DL-71188', licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2026-08-10'), contactNumber: '9876001234',
      safetyScore: 83, tripsCompleted: 19, status: DriverStatus.AVAILABLE,
    },
  })

  // ── Trips ─────────────────────────────────────────────────
  // Completed trips (historical)
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub',
      vehicleId: van05.id, driverId: alex.id,
      cargoWeight: 450, plannedDistance: 35,
      status: TripStatus.COMPLETED,
      finalOdometer: 74035, fuelConsumed: 5.6,
      revenue: 8000,
      eta: new Date('2026-02-10T10:30:00'),
      createdAt: new Date('2026-02-10'),
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      source: 'Gandhinagar', destination: 'Bopal',
      vehicleId: van05.id, driverId: suresh.id,
      cargoWeight: 320, plannedDistance: 22,
      status: TripStatus.COMPLETED,
      finalOdometer: 74057, fuelConsumed: 3.8,
      revenue: 6500,
      eta: new Date('2026-03-05T14:00:00'),
      createdAt: new Date('2026-03-05'),
    },
  })

  const trip3 = await prisma.trip.create({
    data: {
      source: 'Vatva Industrial Area', destination: 'Sanand Warehouse',
      vehicleId: truck11.id, driverId: suresh.id,
      cargoWeight: 3200, plannedDistance: 28,
      status: TripStatus.COMPLETED,
      finalOdometer: 182028, fuelConsumed: 9.4,
      revenue: 22000,
      eta: new Date('2026-03-18T09:00:00'),
      createdAt: new Date('2026-03-18'),
    },
  })

  const trip4 = await prisma.trip.create({
    data: {
      source: 'Mansa', destination: 'Kalol Depot',
      vehicleId: mini03.id, driverId: rajan.id,
      cargoWeight: 200, plannedDistance: 18,
      status: TripStatus.COMPLETED,
      finalOdometer: 51018, fuelConsumed: 2.9,
      revenue: 4000,
      eta: new Date('2026-04-12T11:00:00'),
      createdAt: new Date('2026-04-12'),
    },
  })

  const trip5 = await prisma.trip.create({
    data: {
      source: 'Naroda', destination: 'Bavla Industrial Zone',
      vehicleId: truck07.id, driverId: suresh.id,
      cargoWeight: 6500, plannedDistance: 42,
      status: TripStatus.COMPLETED,
      finalOdometer: 98542, fuelConsumed: 14.2,
      revenue: 35000,
      eta: new Date('2026-05-08T08:30:00'),
      createdAt: new Date('2026-05-08'),
    },
  })

  const trip6 = await prisma.trip.create({
    data: {
      source: 'Odhav', destination: 'Dholka',
      vehicleId: van05.id, driverId: kavita.id,
      cargoWeight: 480, plannedDistance: 55,
      status: TripStatus.COMPLETED,
      finalOdometer: 74112, fuelConsumed: 7.1,
      revenue: 9500,
      eta: new Date('2026-06-14T13:00:00'),
      createdAt: new Date('2026-06-14'),
    },
  })

  const trip7 = await prisma.trip.create({
    data: {
      source: 'Gandhinagar Depot', destination: 'Mehsana Cold Storage',
      vehicleId: mini08.id, driverId: alex.id,
      cargoWeight: 900, plannedDistance: 68,
      status: TripStatus.COMPLETED,
      finalOdometer: 32168, fuelConsumed: 10.5,
      revenue: 13000,
      eta: new Date('2026-07-03T07:45:00'),
      createdAt: new Date('2026-07-03'),
    },
  })

  const trip8 = await prisma.trip.create({
    data: {
      source: 'Sarkhej', destination: 'Viramgam',
      vehicleId: truck02.id, driverId: suresh.id,
      cargoWeight: 5500, plannedDistance: 63,
      status: TripStatus.COMPLETED,
      finalOdometer: 310063, fuelConsumed: 21.0,
      revenue: 41000,
      eta: new Date('2026-07-09T06:00:00'),
      createdAt: new Date('2026-07-09'),
    },
  })

  // Cancelled trips
  await prisma.trip.create({
    data: {
      source: 'Chandkheda', destination: 'Prantij',
      vehicleId: van09.id, driverId: john.id,
      cargoWeight: 400, plannedDistance: 95,
      status: TripStatus.CANCELLED,
      revenue: 7000,
    },
  })

  // Active dispatched trips
  const tripDispatched1 = await prisma.trip.create({
    data: {
      source: 'Gandhinagar Depot', destination: 'Surat Logistics Park',
      vehicleId: truck11.id, driverId: priya.id,
      cargoWeight: 4200, plannedDistance: 280,
      status: TripStatus.DISPATCHED,
      revenue: 58000,
      eta: new Date(Date.now() + 5 * 60 * 60 * 1000),
    },
  })

  const tripDispatched2 = await prisma.trip.create({
    data: {
      source: 'Odhav', destination: 'Rajkot Depot',
      vehicleId: van12.id, driverId: meera.id,
      cargoWeight: 550, plannedDistance: 220,
      status: TripStatus.DISPATCHED,
      revenue: 27000,
      eta: new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
  })

  // Draft trips
  await prisma.trip.create({
    data: {
      source: 'Gandhinagar Depot', destination: 'Vadodara Hub',
      vehicleId: truck07.id, driverId: suresh.id,
      cargoWeight: 7000, plannedDistance: 110,
      status: TripStatus.DRAFT,
      revenue: 65000,
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Naroda', destination: 'Anand Warehouse',
      vehicleId: mini08.id, driverId: kavita.id,
      cargoWeight: 800, plannedDistance: 48,
      status: TripStatus.DRAFT,
      revenue: 9200,
    },
  })

  // ── Maintenance Logs ──────────────────────────────────────
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: mini03.id, serviceType: 'Tyre Replace',    cost: 6200,  date: new Date('2026-07-07'), status: MaintenanceStatus.ACTIVE,    notes: 'All 4 tyres replaced — worn out' },
      { vehicleId: van05.id,  serviceType: 'Oil Change',      cost: 2500,  date: new Date('2026-06-10'), status: MaintenanceStatus.COMPLETED, notes: 'Routine 10k km oil change' },
      { vehicleId: truck11.id,serviceType: 'Engine Repair',   cost: 19000, date: new Date('2026-06-06'), status: MaintenanceStatus.COMPLETED, notes: 'Head gasket replacement' },
      { vehicleId: truck07.id,serviceType: 'Brake Service',   cost: 8400,  date: new Date('2026-06-20'), status: MaintenanceStatus.COMPLETED, notes: 'Front and rear brake pads' },
      { vehicleId: van09.id,  serviceType: 'AC Repair',       cost: 11000, date: new Date('2026-05-15'), status: MaintenanceStatus.COMPLETED, notes: 'Compressor replaced' },
      { vehicleId: mini08.id, serviceType: 'Battery Replace', cost: 4800,  date: new Date('2026-07-02'), status: MaintenanceStatus.COMPLETED, notes: '60Ah battery installed' },
      { vehicleId: truck02.id,serviceType: 'Suspension Fix',  cost: 14500, date: new Date('2026-07-10'), status: MaintenanceStatus.ACTIVE,    notes: 'Front suspension worn — parts ordered' },
      { vehicleId: van05.id,  serviceType: 'Windshield Fix',  cost: 3200,  date: new Date('2026-05-28'), status: MaintenanceStatus.COMPLETED, notes: 'Chip repair and seal' },
    ],
  })

  // ── Fuel Logs ─────────────────────────────────────────────
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: van05.id,   tripId: trip1.id,           date: new Date('2026-07-01'), liters: 42,   cost: 3150 },
      { vehicleId: van05.id,   tripId: trip2.id,           date: new Date('2026-07-03'), liters: 30,   cost: 2250 },
      { vehicleId: van05.id,   tripId: trip6.id,           date: new Date('2026-07-07'), liters: 48,   cost: 3600 },
      { vehicleId: truck11.id, tripId: trip3.id,           date: new Date('2026-07-04'), liters: 110,  cost: 8400 },
      { vehicleId: truck11.id, tripId: tripDispatched1.id, date: new Date('2026-07-11'), liters: 95,   cost: 7220 },
      { vehicleId: mini03.id,                              date: new Date('2026-07-06'), liters: 28,   cost: 2050 },
      { vehicleId: truck07.id, tripId: trip5.id,           date: new Date('2026-07-06'), liters: 138,  cost: 10500 },
      { vehicleId: mini08.id,  tripId: trip7.id,           date: new Date('2026-07-08'), liters: 52,   cost: 3900 },
      { vehicleId: truck02.id, tripId: trip8.id,           date: new Date('2026-07-09'), liters: 182,  cost: 13900 },
      { vehicleId: van12.id,   tripId: tripDispatched2.id, date: new Date('2026-07-12'), liters: 38,   cost: 2850 },
      { vehicleId: mini03.id,                              date: new Date('2026-06-25'), liters: 24,   cost: 1780 },
      { vehicleId: truck02.id,                             date: new Date('2026-07-05'), liters: 160,  cost: 12200 },
    ],
  })

  // ── Expenses ──────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { vehicleId: van05.id,   tripId: trip1.id,  toll: 120,  other: 0,   total: 120 },
      { vehicleId: van05.id,   tripId: trip2.id,  toll: 80,   other: 50,  total: 130 },
      { vehicleId: van05.id,   tripId: trip6.id,  toll: 210,  other: 0,   total: 210 },
      { vehicleId: truck11.id, tripId: trip3.id,  toll: 340,  other: 150, total: 490 },
      { vehicleId: truck07.id, tripId: trip5.id,  toll: 480,  other: 200, total: 680 },
      { vehicleId: mini08.id,  tripId: trip7.id,  toll: 300,  other: 100, total: 400 },
      { vehicleId: truck02.id, tripId: trip8.id,  toll: 620,  other: 350, total: 970 },
      { vehicleId: van12.id,                       toll: 190,  other: 80,  total: 270 },
      { vehicleId: mini03.id,                       toll: 0,    other: 250, total: 250 },
    ],
  })

  console.log('Seed complete.')
  console.log('')
  console.log('Test accounts:')
  console.log('  admin@transitops.in    / admin123    (Admin)')
  console.log('  fleet@transitops.in    / fleet123    (Fleet Manager)')
  console.log('  dispatch@transitops.in / dispatch123 (Dispatcher)')
  console.log('  safety@transitops.in   / safety123   (Safety Officer)')
  console.log('  finance@transitops.in  / finance123  (Financial Analyst)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
