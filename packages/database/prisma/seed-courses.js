import { prisma } from "../src/index.js";

async function main() {
  const mathFaculty = await prisma.faculty.upsert({
    where: { slug: "mathematics" },
    update: {},
    create: { name: "دانشکده ریاضیات", slug: "mathematics" },
  });

  const csDept = await prisma.department.upsert({
    where: { facultyId_slug: { facultyId: mathFaculty.id, slug: "computer-science" } },
    update: {},
    create: { name: "گروه علوم کامپیوتر", slug: "computer-science", facultyId: mathFaculty.id },
  });

  const mathDept = await prisma.department.upsert({
    where: { facultyId_slug: { facultyId: mathFaculty.id, slug: "pure-mathematics" } },
    update: {},
    create: { name: "گروه ریاضیات محض", slug: "pure-mathematics", facultyId: mathFaculty.id },
  });

  const engineeringFaculty = await prisma.faculty.upsert({
    where: { slug: "engineering" },
    update: {},
    create: { name: "دانشکده مهندسی", slug: "engineering" },
  });

  const eeDept = await prisma.department.upsert({
    where: { facultyId_slug: { facultyId: engineeringFaculty.id, slug: "electrical-engineering" } },
    update: {},
    create: { name: "گروه مهندسی برق", slug: "electrical-engineering", facultyId: engineeringFaculty.id },
  });

  const meDept = await prisma.department.upsert({
    where: { facultyId_slug: { facultyId: engineeringFaculty.id, slug: "mechanical-engineering" } },
    update: {},
    create: { name: "گروه مهندسی مکانیک", slug: "mechanical-engineering", facultyId: engineeringFaculty.id },
  });

  const courses = [
    { title: "ساختمان داده و الگوریتم", slug: "data-structures", description: "آشنایی با ساختارهای داده و الگوریتم‌های پایه، شامل آرایه، لیست پیوندی، درخت، گراف و الگوریتم‌های مرتب‌سازی و جستجو", professorName: "دکتر علی محمدی", departmentId: csDept.id, thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop" },
    { title: "هوش مصنوعی", slug: "ai", description: "مبانی هوش مصنوعی، عامل‌های هوشمند، جستجو، یادگیری ماشین و شبکه‌های عصبی", professorName: "دکتر سارا احمدی", departmentId: csDept.id, thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop" },
    { title: "سیستم‌های عامل", slug: "operating-systems", description: "مفاهیم سیستم‌های عامل، مدیریت فرآیند، حافظه، فایل‌سیستم و ورودی/خروجی", professorName: "دکتر رضا کریمی", departmentId: csDept.id, thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop" },
    { title: "آنالیز ریاضی ۱", slug: "mathematical-analysis-1", description: "مبانی آنالیز حقیقی، دنباله‌ها، سری‌ها، پیوستگی و مشتق‌پذیری توابع", professorName: "دکتر فاطمه حسینی", departmentId: mathDept.id, thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop" },
    { title: "جبر خطی", slug: "linear-algebra", description: "فضاهای برداری، تبدیلات خطی، ماتریس‌ها، دستگاه معادلات خطی و مقدار ویژه", professorName: "دکتر محمد رضایی", departmentId: mathDept.id, thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=225&fit=crop" },
    { title: "مبانی الکترونیک", slug: "electronics", description: "مدارهای الکتریکی، نیمه‌هادی‌ها، دیود و ترانزیستور، تقویت‌کننده‌های عملیاتی", professorName: "دکتر امیر کاظمی", departmentId: eeDept.id, thumbnail: "https://images.unsplash.com/photo-1581092335397-9583eb92d2f2?w=400&h=225&fit=crop" },
    { title: "مقاومت مصالح", slug: "strength-of-materials", description: "تنش و کرنش، خمش تیرها، پیچش، تحلیل سازه‌ها و معیارهای گسیختگی", professorName: "دکتر حسن نادری", departmentId: meDept.id, thumbnail: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=225&fit=crop" },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
  }

  console.log("Courses seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
