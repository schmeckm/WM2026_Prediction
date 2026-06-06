const { User } = require('../models');
const { deleteUserImageFiles } = require('./userImageService');
const { saveLeaderboardSnapshot } = require('./leaderboardService');
const { logAudit } = require('./auditService');

async function assertCanDeleteUser(user) {
  if (user.role !== 'admin') return;

  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount <= 1) {
    const err = new Error('LAST_ADMIN');
    err.code = 'LAST_ADMIN';
    throw err;
  }
}

async function deleteUserAccount(user, options = {}) {
  const { req = null, auditAction = 'USER_DELETE' } = options;

  await assertCanDeleteUser(user);

  if (req) {
    await logAudit({
      userId: user.id,
      action: auditAction,
      entityType: 'User',
      entityId: user.id,
      oldValue: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      req,
    });
  }

  deleteUserImageFiles(user.id);
  await user.destroy();
  await saveLeaderboardSnapshot();
}

module.exports = {
  assertCanDeleteUser,
  deleteUserAccount,
};
