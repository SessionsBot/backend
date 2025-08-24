import {  Logtail  } from "@logtail/node";
const sourceToken: string | undefined = process.env['SOURCE_TOKEN'];
const ingestingHost = process.env['INGESTING_HOST'];

if(!sourceToken) console.warn(`{!} LOGTAIL is missing 'sourceToken', log storage will be unavailable!`)
/** Logger utility to log to online storage. */
const logtail = new Logtail(sourceToken || '', {
  endpoint: ingestingHost,
});


export default logtail
