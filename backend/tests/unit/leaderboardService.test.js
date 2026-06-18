require('../helpers/testEnv');
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { sequelize, User, Team, Match, Prediction } = require('../../models');
const { getTeamRanking, getTournamentPhaseStatus, getLeaderboard, buildTeamRankingContributors } = require('../../services/leaderboardService');
const { setSetting } = require('../../services/settingsService');
const { seedTestData } = require('../helpers/seedTestData');

describe('leaderboardService.getTeamRanking', () => {
  before(async () => {
    await sequelize.sync({ force: true });
    await seedTestData();
    await setSetting('teamRankingMode', 'active_predictors_only');
    await setSetting('teamActiveMinPredictions', 1);
  });

  it('counts all assigned team members, including admins excluded from the leaderboard', async () => {
    const team = await Team.findOne({ where: { name: 'IT' } });
    await User.create({
      firstName: 'Markus',
      lastName: 'Schmeckenbecher',
      email: 'team-ranking-admin@test.local',
      password: 'admin123',
      role: 'admin',
      teamId: team.id,
      emailVerified: true,
    });

    const assignedCount = await User.count({ where: { teamId: team.id } });
    const ranking = await getTeamRanking({ skipCache: true });
    const entry = ranking.find((row) => row.teamId === team.id);

    assert.ok(entry);
    assert.equal(entry.userCount, assignedCount);
    assert.ok(entry.userCount >= 2, 'admins assigned to a team should count as members');
  });

  it('excludes non-predictors from team average in active_predictors_only mode', async () => {
    await sequelize.sync({ force: true });
    await seedTestData();
    await setSetting('teamRankingMode', 'active_predictors_only');
    await setSetting('teamActiveMinPredictions', 1);

    const team = await Team.findOne({ where: { name: 'IT' } });
    const match = await Match.findOne();
    const activeUser = await User.findOne({ where: { email: 'verified@example.com' } });

    await User.create({
      firstName: 'Inactive',
      lastName: 'Member',
      email: 'inactive@test.local',
      password: 'user123',
      role: 'user',
      teamId: team.id,
      emailVerified: true,
    });

    await Prediction.create({
      userId: activeUser.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      submittedAt: new Date(),
    });

    await match.update({ status: 'finished', homeScore: 2, awayScore: 1 });

    const activeRanking = await getTeamRanking({ skipCache: true });
    const activeEntry = activeRanking.find((row) => row.teamId === team.id);

    assert.ok(activeEntry);
    assert.equal(activeEntry.activeUserCount, 1);
    assert.equal(activeEntry.averagePoints, 4);

    await setSetting('teamRankingMode', 'all_members');
    const legacyRanking = await getTeamRanking({ skipCache: true });
    const legacyEntry = legacyRanking.find((row) => row.teamId === team.id);

    assert.ok(legacyEntry);
    assert.equal(legacyEntry.averagePoints, 2);
  });

  it('uses all leaderboard members in all_members mode', async () => {
    const contributors = buildTeamRankingContributors(
      [
        { submittedPredictions: 5, totalPoints: 50 },
        { submittedPredictions: 0, totalPoints: 0 },
      ],
      { mode: 'all_members', minPredictions: 1 },
    );
    assert.equal(contributors.length, 2);
  });

  it('tracks past-due prediction coverage separately from overall completion', async () => {
    await sequelize.sync({ force: true });
    await seedTestData();
    await setSetting('teamRankingMode', 'active_predictors_only');

    const team = await Team.findOne({ where: { name: 'IT' } });
    const finishedMatch = await Match.findOne();
    const activeUser = await User.findOne({ where: { email: 'verified@example.com' } });

    await finishedMatch.update({
      status: 'finished',
      homeScore: 1,
      awayScore: 0,
      kickoffTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    const upcomingMatch = await Match.create({
      matchNumber: 9999,
      stage: 'Group A',
      groupName: 'A',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      kickoffTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
    });

    await Prediction.create({
      userId: activeUser.id,
      matchId: upcomingMatch.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      submittedAt: new Date(),
    });

    const leaderboard = await getLeaderboard({ teamId: team.id, skipCache: true });
    const partialUser = leaderboard.find((entry) => entry.userId === activeUser.id);

    assert.ok(partialUser);
    assert.ok(partialUser.pastDueMatches >= 1);
    assert.equal(partialUser.submittedPastPredictions, 0);
    assert.equal(partialUser.pastCompletionPercentage, 0);
    assert.equal(partialUser.submittedPredictions, 1);
    assert.ok(partialUser.completionPercentage < 100);
  });
});

describe('leaderboardService tournament phase filters', () => {
  before(async () => {
    await sequelize.sync({ force: true });
    await seedTestData();
  });

  it('reports knockout as not started when only group matches are active', async () => {
    const status = await getTournamentPhaseStatus();
    assert.equal(status.knockoutStarted, false);
    assert.equal(status.groupStageActive, true);
  });

  it('uses only stage match points for knockout leaderboard filter', async () => {
    const leaderboard = await getLeaderboard({ filter: 'knockout', skipCache: true });
    assert.ok(leaderboard.length > 0);
    for (const entry of leaderboard) {
      assert.equal(entry.totalPoints, entry.matchPoints);
    }
  });
});
