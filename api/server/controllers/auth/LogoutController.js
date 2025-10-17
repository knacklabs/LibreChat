const cookies = require('cookie');
const { isEnabled } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { logoutUser } = require('~/server/services/AuthService');
const { getOpenIdConfig } = require('~/strategies');

const logoutController = async (req, res) => {
  // Entry log to confirm controller is invoked
  try {
    logger.info('[logoutController] invoked', {
      method: req.method,
      path: req.originalUrl || req.url,
      hasCookiesHeader: Boolean(req.headers.cookie),
      hasAuthHeader: Boolean(req.headers.authorization),
      userId: req.user?.id || req.user?._id || null,
      openidId: req.user?.openidId || null,
      query: req.query || {},
    });
  } catch (e) {
    // avoid throwing on logging issues
  }
  const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : null;
  try {
    const logout = await logoutUser(req, refreshToken);
    const { status, message } = logout;
    res.clearCookie('refreshToken');
    res.clearCookie('token_provider');
    const response = { message };
    // Log any incoming redirect hints on request
    if (req.query && (req.query.redirect || req.query.redirect_uri)) {
      logger.info('[logoutController] query redirect detected', {
        redirect: req.query.redirect || req.query.redirect_uri,
      });
    }
    if (
      req.user.openidId != null &&
      isEnabled(process.env.OPENID_USE_END_SESSION_ENDPOINT) &&
      process.env.OPENID_ISSUER
    ) {
      const openIdConfig = getOpenIdConfig();
      if (!openIdConfig) {
        logger.warn(
          '[logoutController] OpenID config not found. Please verify that the open id configuration and initialization are correct.',
        );
      } else {
        const endSessionEndpoint = openIdConfig
          ? openIdConfig.serverMetadata().end_session_endpoint
          : null;
        if (endSessionEndpoint) {
          const postLogoutRedirect = process.env.OPENID_POST_LOGOUT_REDIRECT_URI;
          const clientId = process.env.OPENID_CLIENT_ID;
          let logoutUrl = `${endSessionEndpoint}`;
          if (clientId) {
            logoutUrl += `${logoutUrl.includes('?') ? '&' : '?'}client_id=${encodeURIComponent(clientId)}`;
          }
          if (postLogoutRedirect) {
            logoutUrl += `${logoutUrl.includes('?') ? '&' : '?'}post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
          }
          response.redirect = logoutUrl;
          // logger.info('[logoutController] end_session_endpoint', { endSessionEndpoint, logoutUrl });
        } else {
          logger.warn(
            '[logoutController] end_session_endpoint not found in OpenID issuer metadata. Please verify that the issuer is correct.',
          );
        }
      }
    }
    try {
      logger.info('[logoutController] responding', { status, response });
    } catch (e) {}
    return res.status(status).send(response);
  } catch (err) {
    logger.error('[logoutController]', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  logoutController,
};
