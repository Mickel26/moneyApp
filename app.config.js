// Extends app.json. WEB_BASE_URL is set when building the web app for GitHub Pages,
// which serves it from a sub-path (https://<user>.github.io/<repo>/).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
});
