/**
 * GET /api/resume — proxies the GitHub raw PDF with Content-Disposition: inline
 * so browsers open it in a tab instead of forcing a download (raw.githubusercontent
 * often sends attachment-style behavior).
 */
var RAW_RESUME_PDF =
  'https://raw.githubusercontent.com/e-yang6/personal-resume/main/Ethan_Yang_Resume.pdf';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    var upstream = await fetch(RAW_RESUME_PDF, {
      headers: { Accept: 'application/pdf' },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'resume_upstream_failed' });
    }
    var buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="Ethan_Yang_Resume.pdf"'
    );
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.status(200).send(buf);
  } catch (e) {
    console.warn('Resume proxy error:', e.message);
    return res.status(500).json({ error: 'resume_proxy_error' });
  }
};
