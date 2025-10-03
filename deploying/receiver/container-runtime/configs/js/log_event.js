importClass(logger);

// General
let defaultLog = logger.info;
let debugLog = logger.debug;

// Extract the SET
const SETPayload = JSON.parse(eventStr).claimsJson;

function main() {
    // Debug logs to trace whatever is received
    debugLog("====== Executing the log_event action handler ======")
    defaultLog(`[trace] SET payload received: ${JSON.stringify(SETPayload)}`);
    debugLog("====================================================")
}

main();