import {  Logtail  } from "@logtail/node";
const ENVIRONMENT = process.env['ENVIRONMENT'];
const sourceToken = process.env['SOURCE_TOKEN'];
const ingestingHost = process.env['INGESTING_HOST'];

/** Utility function to store logs to online storage. */
let logtail;

if (ENVIRONMENT !== 'development') {
  logtail = new Logtail(sourceToken || '', {
    endpoint: ingestingHost,
    sendLogsToConsoleOutput: true,
  });
} else {
  // dev environment - log locally:
  logtail = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    log: console.log,
    flush: ()=>{return}
  };
}

export default logtail
