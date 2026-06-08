const { BonusQuestion } = require('../models');
const { DEFAULT_BONUS_QUESTIONS, getDefaultLockTime } = require('../data/defaultBonusQuestions');

async function ensureDefaultBonusQuestions() {
  const lockTime = getDefaultLockTime();
  const created = [];
  const existing = [];

  for (const template of DEFAULT_BONUS_QUESTIONS) {
    const found = await BonusQuestion.findOne({
      where: { resolutionKey: template.resolutionKey },
    });

    if (found) {
      existing.push(found.questionText);
      continue;
    }

    const byText = await BonusQuestion.findOne({
      where: { questionText: template.questionText },
    });
    if (byText) {
      await byText.update({ resolutionKey: template.resolutionKey });
      existing.push(byText.questionText);
      continue;
    }

    await BonusQuestion.create({
      questionText: template.questionText,
      questionType: template.questionType,
      optionsJson: template.optionsJson || null,
      points: template.points,
      lockTime,
      status: 'open',
      resolutionKey: template.resolutionKey,
    });
    created.push(template.questionText);
  }

  return { created, existing, total: DEFAULT_BONUS_QUESTIONS.length };
}

module.exports = { ensureDefaultBonusQuestions };
