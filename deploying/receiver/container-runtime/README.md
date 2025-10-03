# IBM Verify Antenna Receiver on a Container Runtime

IBM Verify Antenna is available as a container image on the [IBM Verify Registry](icr.io/ibm-verify/ibm-verify-antenna:25.05.0).

This document guides you through running an IBM Verify Antenna Receiver on a container runtime, which processes security events complying with the OpenID Shared Signals Framework (SSF).

## Background

The IBM Verify Antenna Receiver is designed to receive and process security events from transmitters using the OpenID Shared Signals Framework (SSF). It can handle various event types including session revocation, credential changes, device compliance changes, and custom events.

## Prerequisites

- A container runtime like Docker or Podman installed

## Configuration

### Generate keys and certificates

The first step is to generate SSL keys and certificates for secure communication. You can use OpenSSL to generate the keys and certificates.

Here's an example of how to generate a self-signed certificate using OpenSSL:

```bash
$ openssl req -x509 -newkey rsa:4096 -keyout keys/server.key -out keys/server.pem -days 365 -nodes
```

This will generate a self-signed certificate with a validity of 365 days under the `keys` directory.

### Create action handlers

Action handlers are responsible for processing different event types and performing specific actions based on the event data. In this example, you will create a sample action handler that prints the event details in standard output. You can find this [log_event.js](configs/js/log_event.js) handler in the `configs/js` directory.

You can add new files under this directory for additional action handlers.

### Add configuration files

After creating the action handlers, you need to add the configuration files for the receiver. The receiver is configured through several YAML files in the `configs` directory. While all of the configuration can be in a single YAML file, this document uses multiple files for clarity.

- **processor.yml**: Configures event processing rules and action handlers.
- **receiver.yml**: Configures the HTTP server, SSL, and event cleaning.
- **storage.yml**: Configures the database storage and keystores.

### Set up environment variables

1. Copy [dotenv](./dotenv) to `.env` file.
2. Modify the properties as needed.

### Final Directory Structure

```
root/
├── configs/
│   ├── js/
│   │   ├── log_event.js
│   ├── keys/
│   │   ├── server.key
│   │   └── server.pem
│   ├── processor.yml
│   ├── receiver.yml
│   └── storage.yml
├── db/
│   └── ssf.db
|── .env
└── docker-compose.yml
```

## Getting Started

1. Create the `db` directory, if it doesn't exist.


2. Start the receiver with Docker Compose or equivalent:

   ```bash
   $ docker-compose up -d
   ```

   The receiver will be available on the port specified in the `.env` file (HTTPS).

3. Register a stream with a SSF-compliant transmitter by using one of the [scripts](./scripts). If you are connecting to a transmitter that is authorized by the IBM Verify OIDC provider, you would need to generate an API client from the same tenant. See the next section for guidance.

### Using IBM Verify tenant to authorize requests to the transmitter

1. Create a new API client in IBM Verify using the instructions provided in the [IBM Verify documentation](https://www.ibm.com/docs/en/security-verify?topic=access-creating-api-clients). You do not need to choose any entitlements.
    -  Note that the UI currently does not allow you to create an API client without entitlements. So, select any arbitrary entitlement. However, once you save it, edit the API client and remove the entitlement.
2. You will use these client credentials directly or generate an access token, depending on the script you use in [scripts](./scripts).

## Internals

### Event Processing

The receiver processes events in the following way:

1. Events are received via HTTPS on your configured port
2. Events are stored in the SQLite database (`db/ssf.db`)
3. Events are processed based on their type using JavaScript handlers
4. Processed events are marked as "actioned" and eventually cleaned up

### Networks

You can use a custom container runtime network if desired. This is to faciliate connections between containers on the same host.

### Security Considerations

- Ensure SSL certificates are properly configured
- Run your container preferably as a non-root user and follow container runtime mandated best practices

## Troubleshooting

- Check logs with `docker-compose logs`
- Verify SSL certificate configuration
