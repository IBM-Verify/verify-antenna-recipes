# VIP Transmitter Recipe

This recipe demonstrates how to configure and deploy IBM Verify Antenna as a transmitter for IBM Verify Identity Protection (VIP) events. The transmitter processes security events from VIP and transforms them into standardized OpenID Shared Signals Framework (SSF) events.

## Overview

IBM Verify Identity Protection (VIP) detects various security threats such as:

- Compromised user accounts
- Access from unauthorized countries
- Other security anomalies

This recipe configures IBM Verify Antenna to:

1. Receive raw VIP security events
2. Transform them into standardized SSF events
3. Transmit them to registered receivers

## Prerequisites

- IBM Verify tenant: Sign up for a free trial at [ibm.biz/verify-trial](https://ibm.biz/verify-trial)
- Access to IBM Verify Identity Protection
- Choose one of the following deployment options:
  - Container runtime (Docker/Podman)
  - Kubernetes cluster

## Deployment Options

You can deploy the VIP transmitter using one of the following methods:

### Option 1: Container Runtime

Follow the instructions in [Container Runtime Deployment](../../deploying/transmitter/container-runtime/README.md) with the following VIP-specific modifications:

1. Use the [vip_event_mapper.js](configs/js/vip_event_mapper.js) transformation handler in the `configs/js` directory

2. Modify the `transmitter.yml` to add the new event source and event types
    - Add the following event types into `transmitter.event_types`
      
        ```yaml
        - "https://schemas.openid.net/secevent/caep/event-type/risk-level-change"
        - "https://schemas.openid.net/secevent/risc/event-type/credential-compromise"
        ```
    
    - Add the following source to `ingester.sources`

        ```yaml
        - id: vip
          type: http_push
        ```

3. Modify the `processor.yml` to add the VIP transform rules in `processor.transform_rules`:

    ```yaml
    - source_id: vip
      type: javascript
      content: "@js/vip_event_mapper.js"
    ```

### Option 2: Kubernetes

Follow the instructions in [Kubernetes Deployment](../../deploying/transmitter/kubernetes/README.md) with the following VIP-specific modifications:

1. Perform the same steps as those listed in the previous section. These changes would then be used to generate Kubernetes artifacts.

2. Continue the process of generating ConfigMaps with the updates.

3. Modify the `transmitter-deployment.yaml` to add the additional transformation handler under the `all-configs` volume. Specifically, add the following to `sources[configMap.name="transmitter-transform-handlers"].items` :

    ```yaml
    - key: vip_event_mapper.js
      path: js/vip_event_mapper.js
    ```

## Explaining the internals

### VIP Event Mapper

The `vip_event_mapper.js` file in the `configs/js` directory contains the transformation logic for VIP events. It handles two types of events:

1. **Compromised User Events**: When a user's credentials are found in data breaches
2. **Unauthorized Access Events**: When a user accesses from unauthorized locations

The mapper transforms these events into SSF-compliant events:

- `credential-compromise` events
- `risk-level-change` events

### User Mapping

The VIP event mapper includes a user mapping feature to map VIP identities to your system's user identities. This is only relevant for demo environments, where the VIP system is shared.

Update the `UserMapping` object in `vip_event_mapper.js` with your own mappings:

```javascript
const UserMapping = {
    "vip-user@example.com": "your-system-user@example.com"
}
```

## Testing

Use the provided test scripts to verify your deployment:

### Test User Compromised Event

[test_user_compromised_event.sh](scripts/test_user_compromised_event.sh) simulates a VIP event indicating that a user's email was found in data breaches. Copy this file to the `scripts` folder and run it.

```bash
./scripts/test_user_compromised_event.sh
```

### Test Unauthorized Access Event

[test_unauthorized_access.sh](scripts/test_unauthorized_access.sh) simulates a VIP event indicating that a user accessed from an unauthorized country. Copy this file to the `scripts` folder and run it.

```bash
./scripts/test_unauthorized_access.sh
```

## Verification

After running the test scripts, verify that:

1. The events are received by the transmitter (check logs)
2. The events are transformed into SSF events (check logs)

## Customization

You can customize this recipe by:

1. Modifying the `vip_event_mapper.js` to handle additional VIP event types
2. Adjusting the transformation logic to meet your specific requirements
3. Updating the user mapping to match your environment

## Troubleshooting

- Check the transmitter logs for errors
- Ensure the user mapping in `vip_event_mapper.js` includes the test users

## Next Steps

After successfully deploying the VIP transmitter:

1. Register receivers to consume the SSF events
2. Configure actions on the receivers based on the received events
