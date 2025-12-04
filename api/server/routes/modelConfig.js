const express = require('express');
const router = express.Router();
const { getModelConfig } = require('../controllers/ModelConfigController');
const requireJwtAuth = require('../middleware/requireJwtAuth');

router.get('/', requireJwtAuth, getModelConfig);

module.exports = router;
