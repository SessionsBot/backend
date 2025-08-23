import {  Logtail  } from "@logtail/node";
;
const sourceToken = process.env['SOURCE_TOKEN'];
const ingestingHost = process.env['INGESTING_HOST'];

/** Exportable logger to log to online storage */
const logtail = new Logtail(sourceToken, {
  endpoint: ingestingHost,
});

export default logtail
