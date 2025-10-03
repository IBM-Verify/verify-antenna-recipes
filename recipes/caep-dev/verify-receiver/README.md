# Receiving CAEP.Dev events

CAEP.Dev is a simulator to test CAEP events. It can operate as a transmitter or a receiver, much like IBM Verify Antenna, and it can be used to test the event processing logic.

In this exercise, you will do the following:

- Configure Antenna Receiver with a new action handler that revokes user sessions and resets their password, in response to a session revoked event.
- Initiate a session revoked event transmission from CAEP.Dev and observe the actions taken on the Antenna.
- If you are running Verify Launchpad (https://tenant.verify.ibm.com/usc) on a browser, you will notice that the login session has been revoked.

## Prerequisites

- Account on CAEP.Dev and an access token that is generated to register streams. You will be led to this by choosing the "Transmitter" option.
- IBM Verify tenant on which the actions will be performed.

## Preparing IBM Verify Antenna Receiver

### Deployment Options

Choose between container runtime and Kubernetes, and use the following as the starting point -

- [Container Runtime](../../../../deploying/receiver/container-runtime)
- Kubernetes (Coming soon)

Stop at building the directory structure. You will need to add additional files in the following sections.

### Create an API client to perform actions

1. Create a new API client in IBM Verify using the instructions provided in the [IBM Verify documentation](https://www.ibm.com/docs/en/security-verify?topic=access-creating-api-clients). Choose the following entitlements:
    -  Read users and groups
    -  Reset password of any user
    -  Revoke all sessions for a user

2. Copy the client ID and secret from the API client you created.

3. Create or identify a user in the Cloud Directory identity source realm. Note the username. This is the one you will use later. Ensure that it has a valid email. Henceforth, this is called `{USERNAME}` in this document.

### Preparing the Action Handler

The action handler used in this cookbook is called [session-revoked.js](configs/js/session_revoked.js). It performs the following actions:

- Finds the user that maps to the event subject by comparing it to the username in Verify
- Revokes login sessions
- Resets the user password

Perform the following steps:

1. Copy the action handler to the `antenna-receiver/configs/js` directory.
    - It is assumed that you followed the steps provided in your chosen deployment option and `antenna-receiver` is the root directory that contains configuration.

2. Modify the following properties in the `session-revoked.js` file:
    - `TENANT`: This is your IBM Verify tenant hostname
    - `CLIENT_ID`: This is the API client ID created in the previous section
    - `CLIENT_SECRET`: This is the API client secret created in the previous section

### Configuration

Assuming you have followed the steps provided in your chosen deployment option, you can now enhance the receiver that has been configured. `antenna-receiver` is the root directory that contains configuration.

1. Add the [session-revoked.js](configs/js/session_revoked.js) file to the action handlers under `antenna-receiver/configs/js` directory.

2. Open `antenna-receiver/processor.yml`. You will notice that it already has the `session-revoked` event type under `processor.action_rules`.

3. Change the `content` property for this event type to `"@js/session-revoked.js"`.

Follow the instructions provided under the chosen deployment option to finish configuring the receiver. For example, in Kubernetes deployments, this is the point where you will create the Kubernetes resources using the action handlers, keys, etc.

### Running the Receiver

Follow the instructions provided under the chosen deployment option to run the receiver.

## Registering the stream

You can now register a stream with CAEP.Dev.

1. Copy the [create_stream_with_token.sh](../../../../deploying/receiver/scripts/create_stream_with_token.sh) to your machine.

2. Modify the script with the following properties:
    - ACCESS_TOKEN="<CAEP.Dev Token>"
    - RECEIVER_HOSTNAME="receiver.dune.com"
    - TRANSMITTER_METADATA_URL="https://ssf.caep.dev/.well-known/ssf-configuration"

3. Run the script.

## Testing the stream

1. Go to CAEP.Dev

2. Click "Start transmitting"

3. Enter the CAEP.Dev access token and click Submit

4. Choose "Event Type" as `Session Revoked`

5. Choose "Subject type" as `Email` and set the "Email" field to the `{USERNAME}` value from the account registered on your tenant.

6. Click "Send CAEP Event"

7. Switch to the Receiver logs and watch the event come in, and try to follow the actions performed.
    - If you have an existing login session with the user, it should be revoked.
    - The user's password should be reset.
