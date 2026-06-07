const { DataTypes } = require('sequelize');

async function ensureColumn(queryInterface, tableInfo, tableName, columnName, columnSpec) {
  if (!tableInfo[columnName]) {
    await queryInterface.addColumn(tableName, columnName, columnSpec);
    console.log(`Migration: Spalte ${tableName}.${columnName} hinzugefügt.`);
    tableInfo[columnName] = columnSpec;
  }
}

const USER_COLUMNS = [
  { name: 'emailVerified', spec: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true } },
  { name: 'emailVerificationToken', spec: { type: DataTypes.STRING, allowNull: true } },
  { name: 'emailVerificationExpires', spec: { type: DataTypes.DATE, allowNull: true } },
  { name: 'passwordResetToken', spec: { type: DataTypes.STRING, allowNull: true } },
  { name: 'passwordResetExpires', spec: { type: DataTypes.DATE, allowNull: true } },
  { name: 'imageUrl', spec: { type: DataTypes.STRING, allowNull: true } },
  { name: 'avatarColor', spec: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'default' } },
  { name: 'avatarEmoji', spec: { type: DataTypes.STRING(16), allowNull: true } },
  { name: 'authProvider', spec: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'local' } },
  { name: 'providerId', spec: { type: DataTypes.STRING, allowNull: true } },
];

async function runMigrations(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const q = (identifier) => queryInterface.queryGenerator.quoteIdentifier(identifier);
  const dialect = sequelize.getDialect();
  const trueVal = dialect === 'postgres' ? 'true' : '1';
  const falseVal = dialect === 'postgres' ? 'false' : '0';
  let userTableInfo;

  try {
    userTableInfo = await queryInterface.describeTable('Users');
  } catch {
    return;
  }

  for (const col of USER_COLUMNS) {
    await ensureColumn(queryInterface, userTableInfo, 'Users', col.name, col.spec);
  }

  await sequelize.query(
    `UPDATE ${q('Users')} SET ${q('emailVerified')} = ${trueVal} WHERE ${q('emailVerified')} IS NULL OR (${q('emailVerified')} = ${falseVal} AND ${q('emailVerificationToken')} IS NULL)`,
  );

  let teamTableInfo;
  try {
    teamTableInfo = await queryInterface.describeTable('Teams');
  } catch {
    return;
  }

  await ensureColumn(queryInterface, teamTableInfo, 'Teams', 'imageUrl', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  let playerImageTableInfo;
  try {
    playerImageTableInfo = await queryInterface.describeTable('PlayerImages');
  } catch {
    return;
  }

  const countryCodeColumn = playerImageTableInfo.countryCode;
  if (countryCodeColumn && /\(3\)/.test(String(countryCodeColumn.type || ''))) {
    await queryInterface.changeColumn('PlayerImages', 'countryCode', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    console.log('Migration: PlayerImages.countryCode auf VARCHAR(64) erweitert.');
  }

  let aiCommentaryTableInfo;
  try {
    aiCommentaryTableInfo = await queryInterface.describeTable('AICommentaries');
  } catch {
    return;
  }

  await ensureColumn(queryInterface, aiCommentaryTableInfo, 'AICommentaries', 'language', {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'de',
  });

  await ensureIndexes(queryInterface);
}

async function ensureIndexSafe(queryInterface, tableName, fields, options = {}) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
    console.log(`Migration: Index ${tableName}(${fields.join(', ')}) hinzugefügt.`);
  } catch (error) {
    if (!/already exists|duplicate/i.test(error.message)) {
      console.warn(`Migration: Index ${tableName}(${fields.join(', ')}) übersprungen: ${error.message}`);
    }
  }
}

async function ensureIndexes(queryInterface) {
  await ensureIndexSafe(queryInterface, 'Predictions', ['userId']);
  await ensureIndexSafe(queryInterface, 'Notifications', ['userId', 'isRead', 'createdAt']);
  await ensureIndexSafe(queryInterface, 'LeaderboardSnapshots', ['snapshotTime']);
  await ensureIndexSafe(queryInterface, 'LeaderboardSnapshots', ['userId', 'snapshotTime']);
  await ensureIndexSafe(queryInterface, 'SyncLogs', ['startedAt']);
  await ensureIndexSafe(queryInterface, 'SyncLogs', ['syncType', 'status', 'startedAt']);
  await ensureIndexSafe(queryInterface, 'Users', ['authProvider', 'providerId'], {
    unique: true,
    name: 'users_auth_provider_id_unique',
  });
}

module.exports = { runMigrations, ensureColumn };
