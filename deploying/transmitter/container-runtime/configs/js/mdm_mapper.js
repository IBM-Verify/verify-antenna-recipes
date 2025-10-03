// Sample transformation of a device event structure to a device compliance event structure.
// @input event structure:
//    {
//      "iss": "mdm_realm",
//      "eventType": "OUT_OF_COMPLIANCE",
//      "eventID": "1234567890",
//      "eventTime": "2021-08-10T10:10:10.000Z",
//      "deviceInfo": {
//        "deviceIdentifier": "slqc",
//        "deviceName": "WIN11-JUNE61",
//        "deviceType": "Desktop",
//        "deviceManufacturer": "QEMU",
//        "deviceModel": "Standard PC (i440FX + PIIX, 1996)",
//        "deviceOS": "Windows"
//        "deviceOSVersion": "10.0.19042",
//      },
//      "user": {
//          "userName": "ppan",
//          "domain": "dune.com"
//      }
//    }

importClass(logger);

// General
let defaultLog = logger.info;
let debugLog = logger.debug;

// Debug logs to trace whatever is received
debugLog("====== Executing the mdm_mapper transformation handler ======")
defaultLog(`[trace] Raw event received: ${eventStr}`);
debugLog("=============================================================")

// Define SSF event classes to make this somewhat well-structured.
// This will move into an out-of-the-box library in the future.
class ComplexSubjectEntry {
    format = "iss_sub";
    constructor(iss, sub) {
        this.iss = iss;
        this.sub = sub;
    }
}

class ComplexSubject {
    format = "complex";
    constructor(deviceSubject, userSubject) {
        this.device = deviceSubject;
        this.user = userSubject;
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

class DeviceComplianceEvent extends SSFEvent {
    current_status = "compliant"
    previous_status = "unknown"
    initiating_entity = "policy"
    constructor(current_status, previous_status, initiating_entity, reason_admin, reason_user, event_timestamp) {
        super("https://schemas.openid.net/secevent/caep/event-type/device-compliance-change", reason_admin, reason_user, event_timestamp);
        this.current_status = current_status;
        this.previous_status = previous_status;
        this.initiating_entity = initiating_entity;
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
function transformEvent(rawEvent) {

    // ignore events that are not of type 'OUT_OF_COMPLIANCE'
    if (rawEvent.eventType != "OUT_OF_COMPLIANCE") {
        return null;
    }

    // construct a CAEP compliance change event
    let iss = rawEvent.iss
    const payload = new SET(
        new ComplexSubject(
            new ComplexSubjectEntry(iss, rawEvent.deviceInfo.deviceIdentifier),
            new ComplexSubjectEntry(iss, rawEvent.user.userName + "@" + rawEvent.user.domain)
        ),
        [
            new DeviceComplianceEvent(
                rawEvent.eventType === "OUT_OF_COMPLIANCE" ? "not-compliant" : rawEvent.eventType,
                "unknown",
                "policy",
                {
                    en: `MDM event; sourceEventId=${rawEvent.eventID}`
                },
                {
                    en: "The MDM provider indicated this change of state"
                },
                new Date(rawEvent.eventTime).getTime()
            )
        ]
    );

    return payload;
}

function main() {
    let rawEvent = JSON.parse(eventStr);

    const transformedData = transformEvent(rawEvent);
    outputData["ssfEvents"] = []
    if (transformedData != null) {
        outputData["ssfEvents"].push(transformedData)
    }
}

main();