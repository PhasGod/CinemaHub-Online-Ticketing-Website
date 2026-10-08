import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../config/db.js"
import { parsePagination } from "../utils/pagination.js"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^0-9a-z-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const movieSchema = z.object({
  title: z.string().trim().min(2, "Tên phim phải có ít nhất 2 ký tự"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  poster: z.string().optional().nullable(),
  format: z.string().default("2D"),
  runtime: z.number().int().positive("Thời lượng phim phải là số dương").default(120),
  rating: z.number().min(0).max(10).default(0.0),
  status: z.enum(["coming_soon", "showing", "ended"]).default("showing"),
  releaseDate: z.string().refine((value) => {
    if (value === "") return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, "Ngày khởi chiếu phải là ngày hợp lệ theo định dạng YYYY-MM-DD").optional().nullable(),
  genreIds: z.array(z.string().uuid("ID thể loại không hợp lệ"))
    .refine((ids) => new Set(ids).size === ids.length, "Không chọn trùng thể loại")
    .optional().default([]),
})

const movieIncludes = {
  genres: { include: { genre: true } },
}

function formatMovie(m: any) {
  return {
    id: m.id,
    title: m.title,
    slug: m.slug,
    description: m.description,
    poster: m.poster,
    format: m.format,
    runtime: m.runtime,
    rating: m.rating,
    status: m.status,
    releaseDate: m.releaseDate,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    genres: (m.genres || []).map((mg: any) => mg.genre),
  }
}

export async function getMovies(req: Request, res: Response) {
  try {
    const q = ((req.query.q || req.query.search) as string | undefined || "").trim()
    const statusFilter = req.query.status as string | undefined
    const genreFilter = (req.query.genreId || req.query.genreSlug) as string | undefined
    let pagination

    try {
      pagination = parsePagination(req.query.page, req.query.limit, 20)
    } catch (err: unknown) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : "Phân trang không hợp lệ",
      })
    }

    const { page, limit, skip } = pagination

    const where: Record<string, unknown> = {}
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }]
    if (statusFilter && ["coming_soon", "showing", "ended"].includes(statusFilter)) where.status = statusFilter
    if (genreFilter) {
      where.genres = {
        some: { OR: [{ genreId: genreFilter }, { genre: { slug: genreFilter } }] },
      }
    }

    const [total, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        include: movieIncludes,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    return res.json({
      movies: movies.map(formatMovie),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    })
  } catch (error) {
    console.error("Get movies error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách phim" })
  }
}

export async function getMovieByIdOrSlug(req: Request, res: Response) {
  try {
    const idOrSlug = req.params["idOrSlug"] as string
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: movieIncludes,
    })
    if (!movie) return res.status(404).json({ error: "Không tìm thấy bộ phim yêu cầu" })
    return res.json({ movie: formatMovie(movie) })
  } catch (error) {
    console.error("Get movie detail error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải thông tin phim" })
  }
}

export async function createMovie(req: Request, res: Response) {
  try {
    const parseResult = movieSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }
    const { title, description, poster, format, runtime, rating, status, releaseDate, genreIds } = parseResult.data
    const slug = (parseResult.data.slug?.trim()) || slugify(title)
    if (!slug) return res.status(400).json({ error: "Tên phim phải tạo được slug hợp lệ" })
    const genreCount = await prisma.genre.count({ where: { id: { in: genreIds } } })
    if (genreCount !== genreIds.length) {
      return res.status(400).json({ error: "Có thể loại không tồn tại" })
    }

    if (await prisma.movie.findUnique({ where: { slug } })) {
      return res.status(400).json({ error: "Slug hoặc tên phim này đã tồn tại" })
    }

    const movie = await prisma.movie.create({
      data: {
        title, slug,
        description: description || null,
        poster: poster || null,
        format, runtime, rating, status,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        genres: { create: genreIds.map((genreId) => ({ genreId })) },
      },
      include: movieIncludes,
    })
    return res.status(201).json({ message: "Tạo phim thành công", movie: formatMovie(movie) })
  } catch (error) {
    console.error("Create movie error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi thêm phim mới" })
  }
}

export async function updateMovie(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const parseResult = movieSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }
    if (!await prisma.movie.findUnique({ where: { id } })) {
      return res.status(404).json({ error: "Không tìm thấy phim" })
    }

    const { title, description, poster, format, runtime, rating, status, releaseDate, genreIds } = parseResult.data
    const slug = (parseResult.data.slug?.trim()) || slugify(title)
    if (!slug) return res.status(400).json({ error: "Tên phim phải tạo được slug hợp lệ" })
    const genreCount = await prisma.genre.count({ where: { id: { in: genreIds } } })
    if (genreCount !== genreIds.length) {
      return res.status(400).json({ error: "Có thể loại không tồn tại" })
    }

    const slugConflict = await prisma.movie.findFirst({ where: { id: { not: id }, slug } })
    if (slugConflict) return res.status(400).json({ error: "Slug này đã bị trùng với phim khác" })

    const updated = await prisma.$transaction(async (tx) => {
      await tx.movieGenre.deleteMany({ where: { movieId: id } })
      return tx.movie.update({
        where: { id },
        data: {
          title, slug,
          description: description || null,
          poster: poster || null,
          format, runtime, rating, status,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          genres: { create: genreIds.map((genreId) => ({ genreId })) },
        },
        include: movieIncludes,
      })
    })

    return res.json({ message: "Cập nhật thông tin phim thành công", movie: formatMovie(updated) })
  } catch (error) {
    console.error("Update movie error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật thông tin phim" })
  }
}

export async function deleteMovie(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    if (!await prisma.movie.findUnique({ where: { id } })) {
      return res.status(404).json({ error: "Không tìm thấy phim" })
    }
    await prisma.movie.delete({ where: { id } })
    return res.json({ message: "Xóa phim thành công" })
  } catch (error) {
    console.error("Delete movie error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi xóa phim" })
  }
}
