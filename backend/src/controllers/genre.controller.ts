import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../config/db.js"

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

const genreSchema = z.object({
  name: z.string().min(2, "Tên thể loại phải có ít nhất 2 ký tự"),
  slug: z.string().optional(),
})

export async function getGenres(_req: Request, res: Response) {
  try {
    const genres = await prisma.genre.findMany({
      include: { _count: { select: { movies: true } } },
      orderBy: { name: "asc" },
    })
    return res.json({
      genres: genres.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        movieCount: g._count.movies,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Get genres error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách thể loại" })
  }
}

export async function createGenre(req: Request, res: Response) {
  try {
    const parseResult = genreSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }
    const { name } = parseResult.data
    const slug = parseResult.data.slug?.trim() || slugify(name)

    const existing = await prisma.genre.findFirst({
      where: { OR: [{ name }, { slug }] },
    })
    if (existing) return res.status(400).json({ error: "Tên hoặc slug thể loại đã tồn tại" })

    const genre = await prisma.genre.create({ data: { name, slug } })
    return res.status(201).json({ message: "Tạo thể loại phim thành công", genre })
  } catch (error) {
    console.error("Create genre error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tạo thể loại phim" })
  }
}

export async function updateGenre(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const parseResult = genreSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }

    if (!await prisma.genre.findUnique({ where: { id } })) {
      return res.status(404).json({ error: "Không tìm thấy thể loại phim" })
    }

    const { name } = parseResult.data
    const slug = parseResult.data.slug?.trim() || slugify(name)

    const conflict = await prisma.genre.findFirst({
      where: { id: { not: id }, OR: [{ name }, { slug }] },
    })
    if (conflict) return res.status(400).json({ error: "Tên hoặc slug thể loại đã bị trùng với bản ghi khác" })

    const genre = await prisma.genre.update({ where: { id }, data: { name, slug } })
    return res.json({ message: "Cập nhật thể loại phim thành công", genre })
  } catch (error) {
    console.error("Update genre error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật thể loại phim" })
  }
}

export async function deleteGenre(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const existing = await prisma.genre.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: "Không tìm thấy thể loại phim" })

    const movieCount = await prisma.movieGenre.count({ where: { genreId: id } })
    if (movieCount > 0) {
      return res.status(400).json({
        error: `Không thể xóa thể loại "${existing.name}" vì đang được ${movieCount} phim sử dụng`,
      })
    }

    await prisma.genre.delete({ where: { id } })
    return res.json({ message: "Xóa thể loại phim thành công" })
  } catch (error) {
    console.error("Delete genre error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi xóa thể loại phim" })
  }
}
