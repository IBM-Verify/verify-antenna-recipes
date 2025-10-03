// Sample transformation of a IBM Verify Identity Protection event structure to corresponding SSF events.
// @input event structure for compromised email
//    {
//      "flow_count": 1,
//      "incident_count": 1,
//      "incidents_url": "https://console.idprotection.verify.ibm.com/issues?q=status%3AOpen%2Bpb_name%3ACompromised%20User%2Bs_name%3AAnthony.Galiamov%40ibm.com",
//      "issue_details_api": "https://console.idprotection.verify.ibm.com/amapi/v1/getIssueDetails?issue_id=185321-1759453163438",
//      "issue_id": "185321-1759453163438",
//      "issue_keys": {
//        "identity_name": "Anthony.Galiamov@ibm.com"
//      },
//      "issue_time": "2025-10-03T00:52:58Z",
//      "issue_type": "Compromised User",
//      "message": "Anthony.Galiamov@ibm.com's email address was found in one or more data breaches",
//      "playbook_name": "Compromised User",
//      "risk": "Critical"
//    }
//
// @input event structure for unauthorized access
//    {
//      "flow_count": 2,
//      "incident_count": 1,
//      "incidents_url": "https://console.idprotection.verify.ibm.com/issues?q=status%3AOpen%2Bpb_name%3AAccess%20to%20Unauthorized%20Countries%2Bid%3A183682",
//      "issue_details_api": "https://console.idprotection.verify.ibm.com/amapi/v1/getIssueDetails?issue_id=183682-1759257494100",
//      "issue_id": "183682-1759257494100",
//      "issue_keys": {
//        "asset_country_name": "Ukraine",
//        "identity_name": "aline.karlovic@authmind.com"
//      },
//      "issue_time": "2025-09-30T18:26:23Z",
//      "issue_type": "Access to Unauthorized Countries",
//      "message": "aline.karlovic@authmind.com accessed Ukraine which is flagged as unauthorized",
//      "playbook_name": "Access to Unauthorized Countries",
//      "risk": "High"
//    }

importClass(logger);

// General
let defaultLog = logger.info;
let debugLog = logger.debug;

// User mapping in case the VIP instance used is a shared demo environment.
const UserMapping = {
    "aline.karlovic@authmind.com": "cap@dune.com",
    "Anthony.Galiamov@ibm.com": "ppan@dune.com"
}

// Debug logs to trace whatever is received
debugLog("====== Executing the vip_event_mapper transformation handler ======")
defaultLog(`[trace] Raw event received: ${eventStr}`);
debugLog("===================================================================")

// Define SSF event classes to make this somewhat well-structured.
// This will move into an out-of-the-box library in the future.
class Subject {
    format = "email";
    constructor(format, opts = {}) {
        this.format = format;
        Object.assign(this, opts);
    }
}

class SSFEvent {
    constructor(event_type, reason_admin, reason_user, event_timestamp) {
        this.event_type = event_type;
        this.reason_admin = reason_admin;
        this.reason_user = reason_user;
        this.event_timestamp = event_timestamp;
    }
}

class CredentialCompromiseEvent extends SSFEvent {
    credential_type = "email";
    constructor(opts = {}) {
        super("https://schemas.openid.net/secevent/risc/event-type/credential-compromise", opts.reason_admin, opts.reason_user, opts.event_timestamp);
        this.credential_type = opts.credential_type;
    }
}

class RiskLevelChangeEvent extends SSFEvent {
    principal = "USER"
    constructor(opts = {}) {
        super("https://schemas.openid.net/secevent/caep/event-type/risk-level-change", opts.reason_admin, opts.reason_user, opts.event_timestamp);
        this.risk_reason = opts.risk_reason;
        this.current_level = opts.current_level;
    }
}

class SET {
    constructor(sub_id, events) {
        this.sub_id = sub_id;
        this.events = {};
        events.forEach((event) => {
            this.events[event.event_type] = event;
        });
    }
}

let outputData = {};

// Transform the raw event received
function transformCompromisedUserEvent(subject, rawEvent) {
    if (rawEvent.risk != "Critical" && rawEvent.risk != "High") {
        return null;
    }

    let events = [
        new RiskLevelChangeEvent({
            "reason_admin": {
                "en": rawEvent.message
            },
            "reason_user": {
                "en": "Your account has been compromised"
            },
            "event_timestamp":  new Date(rawEvent.issue_time).getTime(),
            "risk_reason": rawEvent.message,
            "current_level": "HIGH"
        })
    ];

    if (rawEvent.message.endsWith("email address was found in one or more data breaches")) {
        events.push(new CredentialCompromiseEvent({
            "reason_admin": {
                "en": rawEvent.message
            },
            "reason_user": {
                "en": "Your account has been compromised"
            },
            "event_timestamp":  new Date(rawEvent.issue_time).getTime(),
            "credential_type": "email"
        }));
    }

    const payload = new SET(subject, events);
    return payload;
}

function transformAccessToUnauthorizedCountriesEvent(subject, rawEvent) {
    if (rawEvent.risk != "Critical" && rawEvent.risk != "High") {
        return null;
    }

    let events = [
        new RiskLevelChangeEvent({
            "reason_admin": {
                "en": rawEvent.message
            },
            "reason_user": {
                "en": "Your account is being used to perform unauthorized activities"
            },
            "event_timestamp":  new Date(rawEvent.issue_time).getTime(),
            "risk_reason": rawEvent.message,
            "current_level": "HIGH"
        })
    ];

    const payload = new SET(subject, events);
    return payload;
}

function main() {
    let rawEvent = JSON.parse(eventStr);

    // In a real system, this condition would not exist.
    // However, given that it is very possible that a demo
    // system would be used to generate these events, this
    // check is performed to ensure the subject is relevant.
    if (!(rawEvent.issue_keys.identity_name in UserMapping)) {
        return;
    }

    let email = UserMapping[rawEvent.issue_keys.identity_name];
    const subject = new Subject("email", {
        "email": email
    });

    // Transform events. This can be expanded to add more issue types.
    outputData["ssfEvents"] = []
    let transformedData = null;
    if (rawEvent.issue_type == "Compromised User") {
        transformedData = transformCompromisedUserEvent(subject, rawEvent);
    } else if (rawEvent.issue_type == "Access to Unauthorized Countries") {
        transformedData = transformAccessToUnauthorizedCountriesEvent(subject, rawEvent);
    }

    if (transformedData != null) {
        outputData["ssfEvents"].push(transformedData)
    }
}

main();