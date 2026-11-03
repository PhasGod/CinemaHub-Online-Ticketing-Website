import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { legacyMovieSlugs, managedMoviesData } from "./movieSeedData.js"

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
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "Gia đình", slug: "gia-dinh" },
    { name: "Âm nhạc", slug: "am-nhac" },
    { name: "Chính kịch", slug: "chinh-kich" },
    { name: "Bí ẩn", slug: "bi-an" },
    { name: "Kỳ ảo", slug: "ky-ao" },
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

  // 3. Seed Movies - Danh sách phim chiếu rạp bom tấn 2026
  // Giữ lại mảng cũ để nhận biết dữ liệu mẫu trước đây. Nó không còn được seed.
  const legacyMoviesData = [
    {
      title: "Avengers: Doomsday (2026)",
      slug: "avengers-doomsday",
      description: "Sự trở lại chấn động của Robert Downey Jr. trong vai phản diện Doctor Doom, dẫn đầu cuộc chiến đa vũ trụ chống lại biệt đội Avengers thế hệ mới.",
      poster: "https://image.tmdb.org/t/p/w500/jjD5dcWFusnlrz8HzlZQIPM1Xal.jpg",
      format: "IMAX",
      runtime: 160,
      rating: 9.3,
      status: "showing" as const,
      releaseDate: new Date("2026-05-01"),
      genreSlugs: ["hanh-dong", "khoa-hoc-vien-tuong"],
    },
    {
      title: "The Mandalorian & Grogu (2026)",
      slug: "the-mandalorian-and-grogu",
      description: "Bộ phim điện ảnh hoành tráng của vũ trụ Star Wars theo chân Din Djarin và chú nhóc Grogu trong nhiệm vụ giải cứu dải ngân hà năm 2026.",
      poster: "https://image.tmdb.org/t/p/w500/iBokRdkd1jcBeU0fASO8Vtk25TO.jpg",
      format: "IMAX",
      runtime: 135,
      rating: 9.0,
      status: "showing" as const,
      releaseDate: new Date("2026-05-22"),
      genreSlugs: ["khoa-hoc-vien-tuong", "phieu-luu"],
    },
    {
      title: "Lật Mặt 8: Vòng Xoáy Định Mệnh (2026)",
      slug: "lat-mat-8",
      description: "Phần phim thứ 8 trong chuỗi thương hiệu bom tấn ăn khách nhất lịch sử điện ảnh Việt Nam của đạo diễn Lý Hải ra mắt năm 2026.",
      poster: "https://upload.wikimedia.org/wikipedia/vi/d/d4/%C3%81p_ph%C3%ADch_ch%C3%ADnh_th%E1%BB%A9c_L%E1%BA%ADt_m%E1%BA%B7t_7.jpg",
      format: "2D",
      runtime: 140,
      rating: 9.1,
      status: "showing" as const,
      releaseDate: new Date("2026-04-30"),
      genreSlugs: ["hanh-dong", "tam-ly"],
    },
    {
      title: "Deadpool & Wolverine (IMAX 2026)",
      slug: "deadpool-and-wolverine",
      description: "Phiên bản đặc biệt tái xuất rạp chiếu 2026 của bộ đôi dị nhân lầy lội nhất vũ trụ điện ảnh Marvel.",
      poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      format: "IMAX",
      runtime: 128,
      rating: 8.9,
      status: "showing" as const,
      releaseDate: new Date("2026-07-26"),
      genreSlugs: ["hanh-dong", "hai-huoc"],
    },
    {
      title: "Dune: Hành Tinh Cát 2",
      slug: "dune-part-two",
      description: "Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc mình, đối mặt với sự lựa chọn định mệnh của vũ trụ.",
      poster: "https://media.themoviedb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
      format: "IMAX",
      runtime: 166,
      rating: 9.2,
      status: "showing" as const,
      releaseDate: new Date("2026-03-01"),
      genreSlugs: ["khoa-hoc-vien-tuong", "phieu-luu"],
    },
    {
      title: "Mai (Bản Tri Ân 2026)",
      slug: "mai-tran-thanh",
      description: "Tác phẩm điện ảnh kỷ lục 500 tỷ của Trấn Thành xoay quanh số phận của Mai và mối tình nhiều trắc trở với Dương.",
      poster: "https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg",
      format: "2D",
      runtime: 131,
      rating: 8.7,
      status: "showing" as const,
      releaseDate: new Date("2026-02-10"),
      genreSlugs: ["tam-ly", "tinh-cam"],
    },
    {
      title: "Inside Out 2 (3D 2026)",
      slug: "inside-out-2",
      description: "Riley bước vào tuổi dậy thì với những cảm xúc mới: Lo Âu (Anxiety), Ganh Tị, Xấu Hổ và Chán Nản.",
      poster: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
      format: "3D",
      runtime: 96,
      rating: 9.0,
      status: "showing" as const,
      releaseDate: new Date("2026-06-14"),
      genreSlugs: ["hai-huoc", "phieu-luu"],
    },
    {
      title: "Godzilla x Kong: Đế Chế Mới",
      slug: "godzilla-x-kong-the-new-empire",
      description: "Hai quái thú huyền thoại Godzilla và Kong phải hợp sức chống lại mối đe dọa khổng lồ ẩn sâu dưới Trái Đất đe dọa sự tồn vong của nhân loại.",
      poster: "https://image.tmdb.org/t/p/w500/1DTP1Ph4uzNO6ofRUm7eAimWoKD.jpg",
      format: "IMAX",
      runtime: 115,
      rating: 8.6,
      status: "showing" as const,
      releaseDate: new Date("2026-03-29"),
      genreSlugs: ["hanh-dong", "khoa-hoc-vien-tuong"],
    },
    {
      title: "Avengers: Secret Wars (2026)",
      slug: "avengers-secret-wars",
      description: "Trận chiến đa vũ trụ lớn nhất trong lịch sử điện ảnh Marvel, quy tụ tất cả các siêu anh hùng qua mọi thời đại.",
      poster: "https://image.tmdb.org/t/p/w500/jjD5dcWFusnlrz8HzlZQIPM1Xal.jpg",
      format: "IMAX",
      runtime: 165,
      rating: 9.4,
      status: "coming_soon" as const,
      releaseDate: new Date("2026-12-18"),
      genreSlugs: ["hanh-dong", "khoa-hoc-vien-tuong"],
    },
    {
      title: "Võ Sĩ Giác Đấu 2 (Gladiator II)",
      slug: "gladiator-2",
      description: "Sau nhiều năm chứng kiến người anh hùng Maximus gục ngã, Lucius phải bước vào đấu trường La Mã để tìm lại danh dự và vận mệnh của đế chế.",
      poster: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
      format: "IMAX",
      runtime: 148,
      rating: 8.8,
      status: "coming_soon" as const,
      releaseDate: new Date("2026-10-22"),
      genreSlugs: ["hanh-dong", "phieu-luu"],
    },
    {
      title: "Hành Trình Của Moana 2 (Moana 2)",
      slug: "moana-2",
      description: "Moana nhận được lời kêu gọi bất ngờ từ tổ tiên và dấn thân vào chuyến hải trình nguy hiểm đến những vùng biển xa xôi chưa từng được khám phá.",
      poster: "https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg",
      format: "3D",
      runtime: 100,
      rating: 8.7,
      status: "coming_soon" as const,
      releaseDate: new Date("2026-11-27"),
      genreSlugs: ["phieu-luu", "hai-huoc"],
    },
  ]

  // Chỉ xóa những slug dữ liệu mẫu cũ, không động vào phim do quản trị viên tạo.
  await prisma.movie.deleteMany({ where: { slug: { in: legacyMovieSlugs } } })

  const legacyTitlesToUpgrade = new Set([
    "Avengers: Doomsday (2026)",
    "Dune: Hành Tinh Cát 2",
    "Inside Out 2 (3D 2026)",
    "Hành Trình Của Moana 2 (Moana 2)",
  ])
  const moviesData = managedMoviesData

  for (const mData of moviesData) {
    const { genreSlugs, ...movieInfo } = mData
    const existingMovie = await prisma.movie.findUnique({
      where: { slug: movieInfo.slug },
      select: { id: true, title: true },
    })
    const needsLegacyUpgrade = Boolean(existingMovie && legacyTitlesToUpgrade.has(existingMovie.title))
    const movie = await prisma.movie.upsert({
      where: { slug: movieInfo.slug },
      update: movieInfo,
      create: movieInfo,
    })

    if (!existingMovie || needsLegacyUpgrade || true) {
      await prisma.movieGenre.deleteMany({ where: { movieId: movie.id } })
      for (const slug of genreSlugs) {
        const genreId = createdGenres[slug]
        if (genreId) {
          await prisma.movieGenre.upsert({
            where: { movieId_genreId: { movieId: movie.id, genreId } },
            update: {},
            create: { movieId: movie.id, genreId },
          })
        }
      }
    }
  }
  console.log("Seeded Movies count:", moviesData.length)

  // 4. Seed Cinemas
  const cinemasData = [
    {
      name: "5TOP CINEMA Biên Hòa",
      location: "Biên Hòa",
      address: "1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai",
    },
    {
      name: "5TOP Cinema Long Thành",
      location: "Đồng Nai",
      address: "Tầng 3 TTTM Vincom Plaza Long Thành, Đồng Nai",
    },
    {
      name: "5TOP Cinema Thủ Đức",
      location: "TP. Hồ Chí Minh",
      address: "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP. HCM",
    },
    {
      name: "5TOP Cinema Quận 7 (Crescent Mall)",
      location: "TP. Hồ Chí Minh",
      address: "Tầng 5 Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP. HCM",
    },
    {
      name: "5TOP Cinema Quận 1 (Đồng Khởi)",
      location: "TP. Hồ Chí Minh",
      address: "Tầng 4 Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. HCM",
    },
    {
      name: "5TOP Cinema Gò Vấp",
      location: "TP. Hồ Chí Minh",
      address: "Phan Văn Trị, Phường 7, Quận Gò Vấp, TP. HCM",
    },
    {
      name: "5TOP Cinema Dĩ An",
      location: "Bình Dương",
      address: "Số 01 Đại lộ Bình Dương, Dĩ An, Bình Dương",
    },
    {
      name: "5TOP Cinema Thủ Dầu Một",
      location: "Bình Dương",
      address: "230 Đại lộ Bình Dương, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương",
    },
    {
      name: "5TOP Cinema Ba Đình (Liễu Giai)",
      location: "Hà Nội",
      address: "29 Liễu Giai, P. Ngọc Khánh, Ba Đình, Hà Nội",
    },
    {
      name: "5TOP Cinema Hà Đông",
      location: "Hà Nội",
      address: "Tầng 4 TTTM Aeon Mall Hà Đông, P. Dương Nội, Hà Đông, Hà Nội",
    },
  ]

  const seededCinemas: any[] = []
  for (const cData of cinemasData) {
    const c = await prisma.cinema.upsert({
      where: { name: cData.name },
      update: { location: cData.location, address: cData.address },
      create: {
        name: cData.name,
        location: cData.location,
        address: cData.address,
      },
    })
    seededCinemas.push(c)
  }
  console.log("Seeded Cinemas count:", seededCinemas.length)

  // 5. Seed Rooms & Seats for each Cinema
  const roomsData = [
    { name: "Phòng 01 (IMAX)", format: "IMAX" },
    { name: "Phòng 02 (2D Standard)", format: "2D" },
    { name: "Phòng 03 (3D VIP)", format: "3D" },
  ]

  const rows = ["A", "B", "C", "D", "E", "F"]
  const seatsPerRow = 10

  for (const cinema of seededCinemas) {
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
            capacity: 60,
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

        const activeCount = await prisma.seat.count({ where: { roomId: room.id, isActive: true } })
        await prisma.room.update({
          where: { id: room.id },
          data: { capacity: activeCount },
        })
      }
    }
  }
  console.log("Seeded rooms and seats for all cinemas successfully!")

  // 6. Seed Sample Showtimes for multiple cinemas if showtimes count is low
  const currentShowtimesCount = await prisma.showtime.count()
  if (currentShowtimesCount < 10) {
    const movies = await prisma.movie.findMany({ take: 5 })
    if (movies.length > 0) {
      const now = new Date()
      // Create showtimes for the first 4 cinemas
      for (let ci = 0; ci < Math.min(seededCinemas.length, 5); ci++) {
        const c = seededCinemas[ci]
        const cRooms = await prisma.room.findMany({ where: { cinemaId: c.id } })
        if (cRooms.length === 0) continue

        for (let mi = 0; mi < Math.min(movies.length, 3); mi++) {
          const m = movies[mi]
          const room = cRooms[mi % cRooms.length]

          // Tạo suất chiếu hôm nay và ngày mai
          for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
            const startHour = 10 + (mi * 3) + (dayOffset * 2)
            const stStart = new Date(now)
            stStart.setDate(stStart.getDate() + dayOffset)
            stStart.setHours(startHour % 22, 0, 0, 0)

            const stEnd = new Date(stStart.getTime() + (m.runtime + 15) * 60 * 1000)

            // Check duplicate
            const existing = await prisma.showtime.findFirst({
              where: {
                roomId: room.id,
                startTime: { lt: stEnd },
                endTime: { gt: stStart },
              },
            })

            if (!existing) {
              const newSt = await prisma.showtime.create({
                data: {
                  movieId: m.id,
                  roomId: room.id,
                  startTime: stStart,
                  endTime: stEnd,
                  price: 90000 + (mi % 2 === 0 ? 0 : 20000),
                  status: "ACTIVE",
                },
              })

              const roomSeats = await prisma.seat.findMany({
                where: { roomId: room.id, isActive: true },
                select: { id: true },
              })

              if (roomSeats.length > 0) {
                await prisma.showtimeSeat.createMany({
                  data: roomSeats.map((s) => ({
                    showtimeId: newSt.id,
                    seatId: s.id,
                    status: "AVAILABLE",
                  })),
                  skipDuplicates: true,
                })
              }
            }
          }
        }
      }
      console.log("Seeded sample showtimes across cinemas!")
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
