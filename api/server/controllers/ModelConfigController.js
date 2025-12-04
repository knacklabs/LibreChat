const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const getModelConfig = async (req, res) => {
  try {
    const url = process.env.LITELLM_URL || 'https://admin.knacklabs.ai/model/info';
    const response = await axios.get(url, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching model config', error);
    const status = error.response ? error.response.status : 500;
    const message =
      error.response && error.response.data
        ? error.response.data
        : 'Failed to fetch model configuration';
    res.status(status).json({ error: message });
  }
};

module.exports = {
  getModelConfig,
};
