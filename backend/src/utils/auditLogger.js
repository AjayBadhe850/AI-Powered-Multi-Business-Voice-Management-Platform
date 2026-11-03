import prisma from '../config/db.js';

export const logAudit = async ({ userId, businessId = null, action, entityType, entityId = null, details = null }) => {
  try {
    if (!userId) return null;
    return await prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action,
        entityType,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (err) {
    console.error('Audit log recording failed:', err.message);
    return null;
  }
};

