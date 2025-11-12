/**
 * Usage Controller
 * Fetches usage data from LiteLLM API
 */

const usageController = async (req, res) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get query parameters from the request
    const { start_date: startDate, end_date: endDate } = req.query;

    // Get LiteLLM URL from environment
    const litellmUrl = process.env.LITELLM_URL;
    if (!litellmUrl) {
      return res.status(500).json({ error: 'LiteLLM URL not configured' });
    }

    // Build the proxy URL for usage endpoint
    let usageUrl = `${litellmUrl}/user/daily/activity`;

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    if (params.toString()) {
      usageUrl += `?${params.toString()}`;
    }

    // Make request to the LiteLLM API with proper headers
    const response = await fetch(usageUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Usage API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch usage data' });
    }

    const data = await response.json();

    // Return the response with proper headers
    res.status(200).json(data);

  } catch (error) {
    console.error('Error in usage API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = usageController;
