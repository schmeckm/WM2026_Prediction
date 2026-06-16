const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { buildOpenApiSpec } = require('../openapi/buildOpenApiSpec');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/openapi.json', (req, res) => {
  res.json(buildOpenApiSpec());
});

module.exports = router;
