#!/usr/bin/env node
/**
 * Export "Thin Portal Boilerplate" from WM2026 repo.
 * Usage: node scripts/export-thin-boilerplate.mjs [--output boilerplate-thin/starter]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'boilerplate-thin', 'starter');
const TEMPLATES = path.join(REPO_ROOT, 'boilerplate-thin', 'templates');

const args = process.argv.slice(2);
const outIdx = args.indexOf('--output');
const OUTPUT = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : DEFAULT_OUTPUT;

const COPY_TOP = [
  'backend',
  'frontend',
  'e2e',
  '.github',
  'docker-compose.yml',
  'docker-compose.prod.yml',
  '.env.example',
  '.env.docker.example',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
];

const SKIP_COPY = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'boilerplate-thin',
  'starter',
  '.cursor',
  'backups',
]);

const DELETE_BACKEND_ROUTES = [
  'matchRoutes.js', 'predictionRoutes.js', 'leaderboardRoutes.js', 'scoringRuleRoutes.js',
  'syncRoutes.js', 'bonusRoutes.js', 'statisticsRoutes.js', 'aiRoutes.js', 'adminAiRoutes.js',
  'footballRoutes.js', 'playerImageRoutes.js', 'adminPlayerImageRoutes.js', 'displayRoutes.js',
  'prizeRoutes.js', 'challengeRoutes.js', 'achievementRoutes.js', 'whatIfRoutes.js',
  'activityRoutes.js', 'billingRoutes.js', 'docsRoutes.js',
];

const DELETE_BACKEND_MODELS = [
  'Match.js', 'Prediction.js', 'ScoringRule.js', 'BonusQuestion.js', 'BonusPrediction.js',
  'SyncLog.js', 'LeaderboardSnapshot.js', 'AICommentary.js', 'AIInteractionLog.js', 'PlayerImage.js',
  'Tenant.js', 'TenantSubscription.js',
];

const DELETE_BACKEND_DIRS = [
  'backend/services/providers',
  'backend/data',
  'backend/openapi',
];

const DELETE_BACKEND_SCRIPTS = [
  'backend/scripts/buildWm2026Schedule.js',
];

const SERVICE_DELETE_PATTERNS = [
  /^football/i, /^fixture/i, /^resultSync/i, /^liveScore/i, /^odds/i, /^wm2026/i,
  /^leaderboard/i, /^pointsCalc/i, /^match/i, /^bonus/i, /^playerImage/i, /^youtube/i,
  /^highlights/i, /^marketAnalysis/i, /^groupStand/i, /^theSportsDb/i, /^competition/i,
  /^morningDigest/i, /^ai[A-Z]/, /^llm/i, /^syncLog/i, /^csvImport/i, /^excelExport/i,
  /^statistics/i, /^resultsCopilot/i, /^prize/i, /^challenge/i, /^achievement/i,
  /^whatIf/i, /^activityFeed/i, /^headToHead/i, /^national/i, /^display/i,
  /^externalApiHealth/i, /^oddsSync/i, /^marketOdds/i, /^predictionProtection/i,
  /^wm2026/i, /^manualPlayerImage/i, /^playerImage/i, /^footballTeam/i, /^footballCompetition/i,
  /^bonusResolution/i, /^groupOutlook/i, /^matchPresentation/i, /^matchNumber/i,
  /^matchLockScheduler/i, /^highlightsAutofill/i, /^youtubeHighlights/i,
  /^adminUserEmail/i,
];

const DELETE_FRONTEND_VIEWS = [
  'TipCopilotView.vue', 'MatchesView.vue', 'GroupStandingsView.vue', 'TournamentBracketView.vue',
  'NationalTeamsView.vue', 'MyPredictionsView.vue', 'LeaderboardView.vue', 'PrizesView.vue',
  'TeamRankingView.vue', 'TeamPerformanceView.vue', 'StatisticsView.vue', 'BonusView.vue',
  'AICoachView.vue', 'RulesHelpView.vue', 'FavoritesOverviewView.vue', 'DisplayView.vue',
  'DisplayBracketView.vue', 'PricingView.vue', 'BillingSuccessView.vue', 'BillingCancelView.vue',
];

const DELETE_ADMIN_VIEWS = [
  'AdminImportView.vue', 'AdminResultsCopilotView.vue', 'AdminResultsView.vue', 'AdminMatchesView.vue',
  'AdminGroupStandingsView.vue', 'AdminSyncView.vue', 'AdminBonusView.vue', 'AdminPredictionsView.vue',
  'AdminFavoritesView.vue', 'AdminScoringRulesView.vue', 'AdminPrizesView.vue', 'AdminAIAssistantView.vue',
  'AdminStatisticsView.vue', 'AdminPlayerImagesView.vue', 'AdminTeamPerformanceView.vue',
  'AdminApiDocsView.vue',
];

const DELETE_FRONTEND_COMPONENTS = [
  'MatchCard.vue', 'MatchCardSkeleton.vue', 'MatchTable.vue', 'TipCopilot.vue',
  'BonusQuestionCard.vue', 'GroupStandingsTable.vue', 'GroupOutlook.vue', 'GroupNextMatches.vue',
  'KnockoutPathPreview.vue', 'SyncStatusCard.vue', 'AdminManualModeBanner.vue',
  'MatchesExternalApiStatus.vue', 'TeamFlag.vue', 'TeamLabel.vue',
];

const DELETE_FRONTEND_DIRS = [
  'frontend/src/components/bracket',
  'frontend/src/components/nationalTeams',
];

const DELETE_FRONTEND_STORES = ['footballTeamStore.js'];

const DELETE_BACKEND_SERVICES = [
  'streakService.js',
  'predictionVisibilityService.js',
  'reminderEmailService.js',
];

const DELETE_BACKEND_UTILS = [
  'marketOddsFormat.js',
  'matchMarketOdds.js',
  'predictionValidation.js',
];

const DELETE_INTEGRATION_TESTS = [
  'p2Features.test.js',
  'backup.test.js',
];

const DELETE_UNIT_TESTS = [
  'aiDashboardInsightsService.test.js',
  'headToHeadService.test.js',
  'resultsCopilotService.test.js',
  'groupStandingsService.test.js',
  'excelExportService.test.js',
  'pointsCalculationService.test.js',
  'theSportsDbVenue.test.js',
  'reminderEmailService.test.js',
];

const DELETE_E2E = ['e2e/tests/smoke.spec.js'];

const DELETE_TESTS_GLOB = [
  'backend/tests/unit/match', 'backend/tests/unit/bonus', 'backend/tests/unit/wm2026',
  'backend/tests/unit/theSportsDb', 'backend/tests/unit/marketAnalysis', 'backend/tests/unit/leaderboard',
  'backend/tests/unit/groupStand', 'backend/tests/unit/prediction', 'backend/tests/unit/football',
  'backend/tests/unit/odds', 'backend/tests/unit/morningDigest', 'backend/tests/unit/resultsCopilot',
  'backend/tests/integration/predictions.test.js', 'backend/tests/integration/display.test.js',
];

function rm(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (SKIP_COPY.has(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function applyTemplates() {
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const src = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(src);
      else {
        const rel = path.relative(TEMPLATES, src);
        const dest = path.join(OUTPUT, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
  }
  walk(TEMPLATES);
}

function deleteBackendServices() {
  const dir = path.join(OUTPUT, 'backend/services');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    if (SERVICE_DELETE_PATTERNS.some((re) => re.test(file))) {
      rm(path.join(dir, file));
    }
  }
}

function patchPackageJson(rel, patch) {
  const file = path.join(OUTPUT, rel);
  if (!fs.existsSync(file)) return;
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(pkg, patch);
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

const BOILERPLATE_I18N = {
  en: {
    boilerplate: {
      welcomeTitle: 'Your portal is ready',
      welcomeText: 'This is a thin starter from the WM2026 portal boilerplate. Add your domain routes, views, and reminder emails next.',
    },
  },
  de: {
    boilerplate: {
      welcomeTitle: 'Ihr Portal ist bereit',
      welcomeText: 'Dies ist ein schlanker Starter aus dem WM2026-Portal-Boilerplate. Fügen Sie als Nächstes Ihre Domain-Routen, Views und Erinnerungs-E-Mails hinzu.',
    },
  },
};

function patchLocales() {
  const localesDir = path.join(OUTPUT, 'frontend/src/locales');
  if (!fs.existsSync(localesDir)) return;
  for (const file of fs.readdirSync(localesDir)) {
    if (!file.endsWith('.json')) continue;
    const lang = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const patch = BOILERPLATE_I18N[lang] || BOILERPLATE_I18N.en;
    data.boilerplate = patch.boilerplate;
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  }
}

function patchBranding() {
  const indexHtml = path.join(OUTPUT, 'frontend/index.html');
  if (fs.existsSync(indexHtml)) {
    let html = fs.readFileSync(indexHtml, 'utf8');
    html = html.replace(/WM 2026 Tippspiel/g, 'Portal Boilerplate');
    fs.writeFileSync(indexHtml, html);
  }

  const viteConfig = path.join(OUTPUT, 'frontend/vite.config.js');
  if (fs.existsSync(viteConfig)) {
    let src = fs.readFileSync(viteConfig, 'utf8');
    src = src.replace(/name: 'WM 2026 Tippspiel'/g, "name: 'Portal Boilerplate'");
    src = src.replace(/description: 'FIFA WM 2026 Tippspiel'/g, "description: 'Team portal boilerplate'");
    fs.writeFileSync(viteConfig, src);
  }
}

function patchUserRoutes() {
  const file = path.join(OUTPUT, 'backend/routes/userRoutes.js');
  if (!fs.existsSync(file)) return;
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/const \{ invalidateLeaderboardCache \} = require\('\.\.\/services\/leaderboardService'\);\n\n/, '');
  src = src.replace(/\s*invalidateLeaderboardCache\(\);\n/g, '\n');
  fs.writeFileSync(file, src);
}

function copyStarterReadme() {
  const src = path.join(TEMPLATES, 'README.md');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUTPUT, 'README.md'));
  }
}

function main() {
  console.log(`Exporting thin boilerplate to:\n  ${OUTPUT}\n`);
  rm(OUTPUT);
  fs.mkdirSync(OUTPUT, { recursive: true });

  for (const item of COPY_TOP) {
    const src = path.join(REPO_ROOT, item);
    if (!fs.existsSync(src)) continue;
    copyRecursive(src, path.join(OUTPUT, item));
  }

  for (const f of DELETE_BACKEND_ROUTES) rm(path.join(OUTPUT, 'backend/routes', f));
  for (const f of DELETE_BACKEND_MODELS) rm(path.join(OUTPUT, 'backend/models', f));
  for (const d of DELETE_BACKEND_DIRS) rm(path.join(OUTPUT, d));
  for (const f of DELETE_BACKEND_SCRIPTS) rm(path.join(OUTPUT, f));
  deleteBackendServices();

  for (const f of DELETE_BACKEND_SERVICES) rm(path.join(OUTPUT, 'backend/services', f));
  for (const f of DELETE_BACKEND_UTILS) rm(path.join(OUTPUT, 'backend/utils', f));

  for (const f of DELETE_FRONTEND_VIEWS) rm(path.join(OUTPUT, 'frontend/src/views', f));
  for (const f of DELETE_ADMIN_VIEWS) rm(path.join(OUTPUT, 'frontend/src/views/admin', f));
  for (const d of DELETE_FRONTEND_DIRS) rm(path.join(OUTPUT, d));
  for (const f of DELETE_FRONTEND_STORES) rm(path.join(OUTPUT, 'frontend/src/stores', f));
  for (const f of DELETE_FRONTEND_COMPONENTS) rm(path.join(OUTPUT, 'frontend/src/components', f));
  for (const f of DELETE_E2E) rm(path.join(OUTPUT, f));

  const testsDir = path.join(OUTPUT, 'backend/tests');
  if (fs.existsSync(testsDir)) {
    for (const pattern of DELETE_TESTS_GLOB) {
      const full = path.join(OUTPUT, pattern);
      if (fs.existsSync(full)) rm(full);
    }
    for (const sub of ['unit', 'integration']) {
      const dir = path.join(testsDir, sub);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (/match|prediction|bonus|wm2026|football|odds|leaderboard|market|morning|scorer|display/i.test(file)) {
          rm(path.join(dir, file));
        }
      }
    }
  }

  rm(path.join(OUTPUT, 'PORTAL_BLUEPRINT.md'));
  rm(path.join(OUTPUT, 'CHANGELOG.md'));
  rm(path.join(OUTPUT, 'README.md'));
  rm(path.join(OUTPUT, 'backend/backups'));
  rm(path.join(OUTPUT, 'backend/tests/unit/adminUserEmailService.test.js'));
  for (const f of DELETE_INTEGRATION_TESTS) rm(path.join(OUTPUT, 'backend/tests/integration', f));
  for (const f of DELETE_UNIT_TESTS) rm(path.join(OUTPUT, 'backend/tests/unit', f));

  applyTemplates();
  patchUserRoutes();
  patchLocales();
  patchBranding();
  copyStarterReadme();

  patchPackageJson('backend/package.json', {
    name: 'portal-boilerplate-backend',
    description: 'Thin portal boilerplate – Express API (auth, admin, i18n, email)',
  });
  patchPackageJson('frontend/package.json', {
    name: 'portal-boilerplate-frontend',
    description: 'Thin portal boilerplate – Vue 3 SPA',
  });

  const manifest = {
    exportedAt: new Date().toISOString(),
    sourceRepo: 'WM2026_Prediction',
    outputPath: OUTPUT,
    includes: ['auth', 'admin', 'i18n', 'email-reminders', 'notifications', 'socket', 'docker', 'ci'],
    excludes: ['matches', 'predictions', 'football-api', 'odds', 'bonus', 'leaderboard', 'ai-coach'],
  };
  fs.writeFileSync(path.join(OUTPUT, 'BOILERPLATE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log('Done. Next steps:');
  console.log(`  cd ${path.relative(REPO_ROOT, OUTPUT)}`);
  console.log('  cp backend/.env.example backend/.env');
  console.log('  docker compose up -d   # or npm run dev in backend + frontend');
}

main();
