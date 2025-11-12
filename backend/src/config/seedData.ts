// src/config/seedData.ts
import { AppDataSource } from "./data-source";
import { User } from "../entities/User";
import { Room } from "../entities/Room";
import { Booking } from "../entities/Booking";
import { hashPassword } from "../utils/password";

export async function seedMockData() {
  const userRepo = AppDataSource.getRepository(User);
  const roomRepo = AppDataSource.getRepository(Room);
  const bookingRepo = AppDataSource.getRepository(Booking);

  // ------------ HARD RESET (no TRUNCATE; use DELETE in FK-safe order) ------------
  console.log("⚠️  Clearing existing data...");
  await AppDataSource.manager.transaction(async (trx) => {
    await trx.getRepository(Booking).createQueryBuilder().delete().execute();
    await trx.getRepository(Room).createQueryBuilder().delete().execute();
    await trx.getRepository(User).createQueryBuilder().delete().execute();
  });
  console.log("✅ All tables cleared. Reseeding fresh data...");

  // ------------ USERS ------------
  const users = await userRepo.save([
    { name: "Alice Member", email: "alice@demo.com", passwordHash: await hashPassword("123456"), role: "MEMBER" },
    { name: "Bob Member",   email: "bob@demo.com",   passwordHash: await hashPassword("123456"), role: "MEMBER" },
    { name: "Gina Guest",   email: "gina@demo.com",  passwordHash: await hashPassword("guest123"), role: "GUEST" },
    { name: "Tom Guest",    email: "tom@demo.com",   passwordHash: await hashPassword("guest123"), role: "GUEST" },
  ]);

  // ------------ ROOMS (with availability windows) ------------
  const now = new Date(); now.setSeconds(0, 0);
  const past7 = new Date(now);  past7.setDate(past7.getDate() - 7);
  const plus6m = new Date(now); plus6m.setMonth(plus6m.getMonth() + 6);

  const baseRooms: Partial<Room>[] = [
    {
      name: "Ocean View Suite",
      location: "Tel Aviv",
      capacity: 2,
      amenities: { wifi: true, airCondition: true, tv: true, balcony: true },
      availableFrom: past7,
      availableTo: plus6m,
    },
    {
      name: "City Loft",
      location: "Jerusalem",
      capacity: 4,
      amenities: { wifi: true, airCondition: false, tv: true, balcony: false },
      availableFrom: now,
      availableTo: plus6m,
    },
    {
      name: "Mountain Cabin",
      location: "Haifa",
      capacity: 6,
      amenities: { wifi: false, airCondition: true, tv: false, balcony: true },
      availableFrom: past7,
      availableTo: plus6m,
    },
    {
      name: "Downtown Studio",
      location: "Eilat",
      capacity: 1,
      amenities: { wifi: true, airCondition: true, tv: false, balcony: false },
      availableFrom: now,
      availableTo: plus6m,
    },
    {
      name: "Luxury Penthouse",
      location: "Herzliya",
      capacity: 5,
      amenities: { wifi: true, airCondition: true, tv: true, balcony: true },
      availableFrom: past7,
      availableTo: plus6m,
    },
    {
      name: "Garden Apartment",
      location: "Ramat Gan",
      capacity: 3,
      amenities: { wifi: true, airCondition: true, tv: false, balcony: true },
      availableFrom: now,
      availableTo: plus6m,
    },
  ];

  const roomsSeeded = await roomRepo.save(baseRooms);

  // Fill up to 36 rooms with staggered availability
  const locations = ["Tel Aviv","Jerusalem","Haifa","Eilat","Herzliya","Ramat Gan","Beer Sheva","Netanya","Ashdod"];
  const extra: Room[] = [];
  for (let i = roomsSeeded.length; i < 36; i++) {
    const loc = locations[i % locations.length];
    const capacity = 1 + (i % 6);

    const af = new Date(now);
    af.setDate(af.getDate() + ((i % 10) - 4)); // some start a bit in past/future

    const at = new Date(plus6m);
    at.setDate(at.getDate() - (i % 21)); // slightly different end dates

    extra.push(
      roomRepo.create({
        name: `Demo Room #${i + 1}`,
        location: loc,
        capacity,
        amenities: {
          wifi: true,
          airCondition: i % 2 === 0,
          tv: i % 3 !== 0,
          balcony: i % 4 === 0,
        },
        availableFrom: af,
        availableTo: at,
      })
    );
  }
  if (extra.length) await roomRepo.save(extra);

  const rooms = await roomRepo.find();
  console.log(`✅ Inserted ${rooms.length} rooms (with availability).`);

  // ------------ BOOKINGS (inside availability windows) ------------
  console.log("🌱 Seeding mock bookings within availability windows...");
  const BOOKINGS_TO_CREATE = Math.min(24, rooms.length);
  const bookings: Booking[] = [];

  for (let i = 0; i < BOOKINGS_TO_CREATE; i++) {
    const room = rooms[i];
    const user = users[i % users.length];

    const start = new Date(
      Math.max(
        room.availableFrom ? room.availableFrom.getTime() : now.getTime(),
        now.getTime() + (i % 6) * 24 * 60 * 60 * 1000 // stagger in the near future
      )
    );
    start.setHours(15, 0, 0, 0); // check-in 15:00

    const stayDays = 2 + (i % 3); // 2–4 nights
    const end = new Date(start);
    end.setDate(end.getDate() + stayDays);
    end.setHours(11, 0, 0, 0); // check-out 11:00

    if (room.availableTo && end > room.availableTo) continue;

    bookings.push(
      bookingRepo.create({
        user,
        room,
        startTime: start,
        endTime: end,
        status: "CONFIRMED",
        expiresAt: null,
      })
    );
  }
  if (bookings.length) await bookingRepo.save(bookings);
  console.log(`✅ Inserted ${bookings.length} mock bookings.`);

  console.log("✅ Seed complete.");
}
