const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'open',
  },
  pageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  appVersion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  githubIssueNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  githubIssueUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  githubIssueCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Feedback;
