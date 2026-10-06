import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const salt = await bcrypt.genSalt(10)
  const defaultPasswordHash = await bcrypt.hash("123456", salt)

  // 1. Seed Users (Do not reset password if existing)
  const admin = await prisma.user.upsert({
    where: { email: "admin@5top.vn" },
    update: {},
    create: {
      email: "admin@5top.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Quản trị viên 5TOP",
      phone: "0900000001",
      role: "admin",
      isActive: true,
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: "staff@5top.vn" },
    update: {},
    create: {
      email: "staff@5top.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Nhân viên Bán Vé",
      phone: "0900000002",
      role: "staff",
      isActive: true,
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: "user@5top.vn" },
    update: {},
    create: {
      email: "user@5top.vn",
      passwordHash: defaultPasswordHash,
      fullName: "Nguyễn Minh Anh",
      phone: "0901234567",
      role: "customer",
      isActive: true,
    },
  })

  console.log("Seeded Users:", { admin: admin.email, staff: staff.email, customer: customer.email })

  // 2. Seed Genres
  const genresData = [
    { name: "Hành động", slug: "hanh-dong" },
    { name: "Khoa học viễn tưởng", slug: "khoa-hoc-vien-tuong" },
    { name: "Tình cảm", slug: "tinh-cam" },
    { name: "Phiêu lưu", slug: "phieu-luu" },
    { name: "Tâm lý", slug: "tam-ly" },
    { name: "Hài hước", slug: "hai-huoc" },
    { name: "Kinh dị", slug: "kinh-di" },
  ]

  const createdGenres: Record<string, string> = {}
  for (const g of genresData) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: g,
    })
    createdGenres[g.slug] = genre.id
  }
  console.log("Seeded Genres count:", Object.keys(createdGenres).length)

  // 3. Seed Movies
  const moviesData = [
    {
      title: "Avengers: Secret Wars",
      slug: "avengers-secret-wars",
      description: "Trận chiến đa vũ trụ lớn nhất bắt đầu. Những người hùng cuối cùng phải sát cánh để bảo vệ mọi thực tại.",
      poster: "https://images.unsplash.com/photo-1679482451632-b2e126da7142?auto=format&fit=crop&w=800&q=85",
      format: "IMAX",
      runtime: 135,
      rating: 8.8,
      status: "showing" as const,
      releaseDate: new Date("2026-09-20"),
      genreSlugs: ["hanh-dong", "phieu-luu"],
    },
    {
      title: "Đêm Thành Phố",
      slug: "dem-thanh-pho",
      description: "Hành trình truy lùng sự thật trong góc tối thành phố đầy cạm bẫy và bí ẩn.",
      poster: "https://images.unsplash.com/photo-1727018663219-b0bd25a359e9?auto=format&fit=crop&w=800&q=85",
      format: "2D",
      runtime: 128,
      rating: 8.6,
      status: "showing" as const,
      releaseDate: new Date("2026-09-22"),
      genreSlugs: ["hanh-dong", "tam-ly"],
    },
    {
      title: "Vượt Ngoài Biên Giới",
      slug: "vuot-nguai-bien-gioi",
      description: "Chuyến du hành không gian vượt qua các vì sao để tìm kiếm hành tinh mới cho nhân loại.",
      poster: "https://images.unsplash.com/photo-1697985189201-293f0ddfc36d?auto=format&fit=crop&w=800&q=85",
      format: "3D",
      runtime: 141,
      rating: 9.1,
      status: "showing" as const,
      releaseDate: new Date("2026-09-25"),
      genreSlugs: ["khoa-hoc-vien-tuong", "phieu-luu"],
    },
    {
      title: "Mùa Hè Năm Ấy",
      slug: "mua-he-nam-ay",
      description: "Câu chuyện tình yêu tuổi trẻ đầy hoài niệm, ngập tràn ánh nắng và ký ức rực rỡ.",
      poster: "https://images.unsplash.com/photo-1606603696914-a0f46d934b9c?auto=format&fit=crop&w=800&q=85",
      format: "2D",
      runtime: 108,
      rating: 8.2,
      status: "coming_soon" as const,
      releaseDate: new Date("2026-10-15"),
      genreSlugs: ["tinh-cam", "tam-ly"],
    },
    {
      title: "Người Hùng Cuối Cùng",
      slug: "nguoi-hung-cuoi-cung",
      description: "Huyền thoại về một chiến binh cô độc chiến đấu vì công lý giữa lòng sa mạc khắc nghiệt.",
      poster: "https://images.unsplash.com/photo-1682806816936-c3ac11f65112?auto=format&fit=crop&w=800&q=85",
      format: "IMAX",
      runtime: 122,
      rating: 8.7,
      status: "coming_soon" as const,
      releaseDate: new Date("2026-10-20"),
      genreSlugs: ["hanh-dong", "phieu-luu"],
    },
    {
      title: "Chuyện Ở Rạp Cũ",
      slug: "chuyen-o-rap-cu",
      description: "Bộ phim tâm lý sâu lắng kể về hành trình bảo vệ một rạp chiếu phim lâu đời của thị trấn.",
      poster: "https://images.unsplash.com/photo-1629474468919-64a55bbae8eb?auto=format&fit=crop&w=800&q=85",
      format: "2D",
      runtime: 112,
      rating: 8.4,
      status: "ended" as const,
      releaseDate: new Date("2026-08-01"),
      genreSlugs: ["tam-ly"],
    },
  ]

  for (const mData of moviesData) {
    const { genreSlugs, ...movieInfo } = mData
    const movie = await prisma.movie.upsert({
      where: { slug: movieInfo.slug },
      update: movieInfo,
      create: movieInfo,
    })

    // Connect Genres
    for (const slug of genreSlugs) {
      const genreId = createdGenres[slug]
      if (genreId) {
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId,
            },
          },
          update: {},
          create: {
            movieId: movie.id,
            genreId,
          },
        })
      }
    }
  }
  console.log("Seeded Movies count:", moviesData.length)

  // 4. Seed Cinema
  const cinema = await prisma.cinema.upsert({
    where: { name: "5TOP CINEMA Biên Hòa" },
    update: { location: "Biên Hòa", address: "123 Đường Phạm Văn Thuận, P. Tân Tiến, Biên Hòa" },
    create: {
      name: "5TOP CINEMA Biên Hòa",
      location: "Biên Hòa",
      address: "123 Đường Phạm Văn Thuận, P. Tân Tiến, Biên Hòa",
    },
  })
  console.log("Seeded Cinema:", cinema.name)

  // 5. Seed Rooms & Seats
  const roomsData = [
    { name: "Phòng 01 (IMAX)", format: "IMAX" },
    { name: "Phòng 02 (2D Standard)", format: "2D" },
    { name: "Phòng 03 (3D VIP)", format: "3D" },
  ]

  const rows = ["A", "B", "C", "D", "E", "F"]
  const seatsPerRow = 10

  for (const rData of roomsData) {
    let room = await prisma.room.findUnique({
      where: {
        cinemaId_name: {
          cinemaId: cinema.id,
          name: rData.name,
        },
      },
    })

    if (!room) {
      room = await prisma.room.create({
        data: {
          cinemaId: cinema.id,
          name: rData.name,
          format: rData.format,
          capacity: 0,
        },
      })
    }

    // Seed Seats for Room if empty
    const existingSeatsCount = await prisma.seat.count({ where: { roomId: room.id } })
    if (existingSeatsCount === 0) {
      const seatsToCreate = []
      for (const row of rows) {
        const seatType = ["D", "E", "F"].includes(row) ? ("vip" as const) : ("standard" as const)
        for (let num = 1; num <= seatsPerRow; num++) {
          seatsToCreate.push({
            roomId: room.id,
            row,
            number: num,
            type: seatType,
            isActive: true,
          })
        }
      }

      await prisma.seat.createMany({
        data: seatsToCreate,
        skipDuplicates: true,
      })

      // Update Room capacity to count of active seats
      const activeCount = await prisma.seat.count({ where: { roomId: room.id, isActive: true } })
      await prisma.room.update({
        where: { id: room.id },
        data: { capacity: activeCount },
      })
      console.log(`Seeded ${seatsToCreate.length} seats for room ${room.name}. Capacity: ${activeCount}`)
    }
  }
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
