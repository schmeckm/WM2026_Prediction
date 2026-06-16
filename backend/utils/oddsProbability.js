function calculateProbabilities(homeOdds, drawOdds, awayOdds) {
  const pHome = 1 / homeOdds;
  const pDraw = 1 / drawOdds;
  const pAway = 1 / awayOdds;
  const total = pHome + pDraw + pAway;

  return {
    home: +(pHome / total * 100).toFixed(1),
    draw: +(pDraw / total * 100).toFixed(1),
    away: +(pAway / total * 100).toFixed(1),
  };
}

module.exports = { calculateProbabilities };
