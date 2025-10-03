# IBM Verify Antenna Transmitter on a Container Runtime

IBM Verify Antenna is available as a container image on the [IBM Verify Registry](icr.io/ibm-verify/ibm-verify-antenna:25.05.0).

This document guides you through running an IBM Verify Antenna Transmitter on a container runtime, which processes raw events pushed from a source and transforms it into events complying with the OpenID Shared Signals Framework (SSF).

## Background

The IBM Verify Antenna Transmitter is designed to ingest raw security events, transform them into SSF-compliant events and transmit them to SSF receivers. Given transformation logic is written in JavaScript, the transformation handlers can be as simple or as complex as needed.

> 📘 Note
> 
> The transformation handlers determine the resource requirements to run Antenna. A very complex handler can impact the processing rate.
> Simple object-to-object mapping is a common approach. Augmenting events by calling out to external sources is discouraged.

## Prerequisites

- A container runtime like Docker or Podman installed
- An IBM Verify tenant: You can sign up for a free trial at [ibm.biz/verify-trial](https://ibm.biz/verify-trial). This will be referenced in this document and in configuration files as `tenant.verify.ibm.com`.

## Configuration

### Setting up the local directory

> 📘 Note
> 
> You will need to perform these steps only if you choose not to clone this Github repository to your local system.

You will build a directory structure that matches [configs](configs).

Create a directory in your system called `antenna-transmitter` and copy the contents of the [configs](configs) directory into it. All commands from this point onwards will be executed from the `antenna-transmitter` directory.

### Generate keys and certificates

The first step is to generate SSL keys and certificates for secure communication. You can use OpenSSL to generate the keys and certificates.

Here's an example of how to generate a self-signed certificate using OpenSSL:

```bash
$ openssl req -x509 -newkey rsa:4096 -keyout configs/keys/server.key -out configs/keys/server.pem -days 365 -nodes -addext "subjectAltName = DNS:<hostname>"
```

This will generate a self-signed certificate with a validity of 365 days under the `keys` directory that are used to run the HTTPS server.

You will also need a key-pair to sign the security event tokens. You can use OpenSSL to generate the key-pair as well.
Here's an example of how to generate a key-pair using OpenSSL:

```bash
$ openssl req -x509 -newkey rsa:4096 -keyout configs/keys/jwtsigner.key -out configs/keys/jwtsigner.pem -days 365 -nodes
```

### Create transformation handlers

Transformation handlers process incoming raw events and transform them into the SSF standardized format. You can find the transformation handlers in the `configs/js` directory. There is an example handler provided that transforms a device event received from a mobile device management system (like IBM MaaS360) and converts it into a SSF CAEP event for device compliance changes.

You can add new files under this directory for additional transformation handlers.

### Configure authorization scheme

The authorization scheme in [transmitter.yml](configs/transmitter.yml) needs to be populated with valid values. The instructions in this section is based on IBM Verify as the authorization server.

1.  Create a new API client in IBM Verify using the instructions provided in the [IBM Verify documentation](https://www.ibm.com/docs/en/security-verify?topic=access-creating-api-clients). You do not need to choose any entitlements.
    -  Note that the UI currently does not allow you to create an API client without entitlements. So, select any arbitrary entitlement. However, once you save it, edit the API client and remove the entitlement.
2.  Populate the `transmitter.yml` with the following values:
    -  `authorization_schemes[].client_id`: The client ID of the API client created in step 1.
    -  `authorization_schemes[].client_secret`: The client ID of the API client created in step 1.
    -  `authorization_schemes[].discovery_uri`: Replace the hostname in the URL with the hostname of your IBM Verify tenant.

> 📘 Note
> 
> Any receiver that needs to connect to this transmitter will need to generate an OAuth token generated 
> by the same IBM Verify tenant.
> 
> This implies that any receiver would need to either be issued a long-lived access token or OAuth client credentials
> (generated as an API client).

### TLS certificates for transmitter connections

In the event that you are connecting this receiver to a transmitter that is using a non-standard CA certificate or a self-signed certificate, you have to perform the following steps:

1. Obtain the public certificate of the transmitter. You can do so by accessing the `/.well-known/ssf-metadata` endpoint of the transmitter and exporting the certificate.

2. Create a `ca-bundle.pem` file under `configs/keys` directory.

3. Copy the public certificate into the `ca-bundle.pem` file.

4. Add the environment variable in the `docker-compose.yml` file to override the CA bundle to be used on the receiver.

    ```
    environment:
      - SSL_CERT_FILE=/configs/keys/ca-bundle.pem
    ```

### Set up environment variables

1. Copy [dotenv](./dotenv) to `.env` file.
2. Modify the properties as needed.
3. Ensure that the `HOSTNAME` value is synchronized in the `transmitter.yml`.

### Final Directory Structure

```
antenna-transmitter/
├── configs/
│   ├── js/
│   │   ├── log_event.js
│   ├── keys/
│   │   ├── jwtsigner.key
│   │   ├── jwtsigner.pem
│   │   ├── server.key
│   │   └── server.pem
│   ├── processor.yml
│   ├── transmitter.yml
│   └── storage.yml
├── db/
│   └── ssf.db
|── .env
└── docker-compose.yml
```

## Running the transmitter

1. Create the `db` directory, if it doesn't exist.

2. Start the transmitter with Docker Compose or equivalent:

   ```bash
   $ docker-compose up -d
   ```

3. Open a browser and verify that you are able to connect to https://{HOSTNAME}:9044/.well-known/ssf-configuration

## Troubleshooting

- Check logs with `docker-compose logs`
- Verify SSL certificate configuration
- Verify network connectivity