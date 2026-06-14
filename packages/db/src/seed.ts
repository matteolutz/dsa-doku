import { prisma } from '.';

export const seedDb = async () => {
  // 1. upsert admin registration code
  const registrationCode = process.env.ADMIN_REGISTRATION_CODE;
  if (registrationCode) {
    prisma.registrationCode.upsert({
      where: { code: registrationCode },
      update: {},
      create: {
        code: registrationCode,
        userRole: 'ADMIN',
        allowReuse: false
      }
    });
  }
};
