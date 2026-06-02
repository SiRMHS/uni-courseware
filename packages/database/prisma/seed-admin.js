import { prisma } from "../src/index.js";
import bcrypt from "bcryptjs";

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@uni.ac.ir" },
    update: {},
    create: {
      name: "مدیر سیستم",
      email: "admin@uni.ac.ir",
      password: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Admin user created: ${admin.email} / admin123`);

  const studentPassword = await bcrypt.hash("student123", 12);

  await prisma.user.upsert({
    where: { email: "student@uni.ac.ir" },
    update: {},
    create: {
      name: "علی دانشجو",
      email: "student@uni.ac.ir",
      password: studentPassword,
      role: "STUDENT",
    },
  });

  console.log(`Student user created: student@uni.ac.ir / student123`);

  const professorPassword = await bcrypt.hash("prof123", 12);

  await prisma.user.upsert({
    where: { email: "prof@uni.ac.ir" },
    update: {},
    create: {
      name: "دکتر محمدی",
      email: "prof@uni.ac.ir",
      password: professorPassword,
      role: "PROFESSOR",
    },
  });

  console.log(`Professor user created: prof@uni.ac.ir / prof123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
