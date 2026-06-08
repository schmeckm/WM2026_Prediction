const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PlayerImage = sequelize.define('PlayerImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  playerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  teamName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  countryCode: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'placeholder',
  },
  sourceId: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  licenseInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attributionText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastCheckedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isManuallyApproved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['playerName', 'teamName'],
    },
  ],
});

module.exports = PlayerImage;
