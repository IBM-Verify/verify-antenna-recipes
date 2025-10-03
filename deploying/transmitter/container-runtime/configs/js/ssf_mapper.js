// Sample transformation to log the received SSF-compliant event structure and return it.

importClass(logger);

// General
let defaultLog = logger.info;
let debugLog = logger.debug;

// Debug logs to trace whatever is received
debugLog("====== Executing the ssf_mapper transformation handler ======")
defaultLog(`[trace] Raw event received: ${eventStr}`);
debugLog("=============================================================")

let outputData = {};

function main() {
    let rawEvent = JSON.parse(eventStr);
    
    outputData["ssfEvents"] = []
    outputData["ssfEvents"].push(rawEvent)
}

main();