const { Logtail } = require("@logtail/node");
const sourceToken = process.env['SOURCE_TOKEN'];
const ingestingHost = process.env['INGESTING_HOST'];

/** Exportable logger to log to online storage */
const logtail = new Logtail(sourceToken, {
  endpoint: ingestingHost,
});

module.exports = logtail
