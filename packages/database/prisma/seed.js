import { prisma } from "../src/index.js";

/**
 * Seed data is driven entirely by environment variables — no hardcoded FTP paths.
 * Set SEED_MODULES as JSON array in env for production seeding.
 */
async function main() {
  const seedModulesRaw = process.env.SEED_MODULES;

  if (!seedModulesRaw) {
    console.log(
      "No SEED_MODULES env var set. Skipping seed. Example:\n" +
        'SEED_MODULES=\'[{"type":"LIBRARY_BOOK","name":"کتابخانه مرکزی","systemKey":"central-library","ftpBaseRoot":"/library"}]\''
    );
    return;
  }

  let modules;
  try {
    modules = JSON.parse(seedModulesRaw);
  } catch {
    throw new Error("SEED_MODULES must be valid JSON");
  }

  for (const mod of modules) {
    const created = await prisma.dynamicModule.upsert({
      where: { systemKey: mod.systemKey },
      update: {
        name: mod.name,
        type: mod.type,
        ftpBaseRoot: mod.ftpBaseRoot,
      },
      create: {
        type: mod.type,
        name: mod.name,
        systemKey: mod.systemKey,
        ftpBaseRoot: mod.ftpBaseRoot,
      },
    });

    if (Array.isArray(mod.items)) {
      for (const item of mod.items) {
        await prisma.moduleItem.upsert({
          where: {
            moduleId_slug: {
              moduleId: created.id,
              slug: item.slug,
            },
          },
          update: {
            title: item.title,
            relativeFtpPath: item.relativeFtpPath,
            metaAttributes: item.metaAttributes ?? null,
            parentId: item.parentSlug
              ? (
                  await prisma.moduleItem.findFirst({
                    where: { moduleId: created.id, slug: item.parentSlug },
                  })
                )?.id ?? null
              : null,
          },
          create: {
            moduleId: created.id,
            title: item.title,
            slug: item.slug,
            relativeFtpPath: item.relativeFtpPath,
            metaAttributes: item.metaAttributes ?? null,
            parentId: item.parentSlug
              ? (
                  await prisma.moduleItem.findFirst({
                    where: { moduleId: created.id, slug: item.parentSlug },
                  })
                )?.id ?? null
              : null,
          },
        });
      }
    }
  }

  const folderConfigsRaw = process.env.SEED_FOLDER_CONFIGS;
  if (folderConfigsRaw) {
    const configs = JSON.parse(folderConfigsRaw);
    for (const cfg of configs) {
      await prisma.folderConfig.upsert({
        where: { targetPath: cfg.targetPath },
        update: { lmsMode: cfg.lmsMode ?? false },
        create: {
          targetPath: cfg.targetPath,
          lmsMode: cfg.lmsMode ?? false,
        },
      });
    }
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
