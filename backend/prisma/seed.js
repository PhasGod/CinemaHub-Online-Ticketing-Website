import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    console.log("Seeding database...");
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("123456", salt);
    // Seed Users
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
    });
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
    });
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
    });
    console.log("Seeded Users:", { admin: admin.email, staff: staff.email, customer: customer.email });
}
main()
    .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
