# IBM Verify Antenna Transmitter on Kubernetes

This document guides you through running an IBM Verify Antenna Transmitter on a Kubernetes cluster.

## Background

The IBM Verify Antenna Transmitter is designed to ingest raw security events, transform them into SSF-compliant events and transmit them to SSF receivers. Given transformation logic is written in JavaScript, the transformation handlers can be as simple or as complex as needed.

> 📘 Note
> 
> The transformation handlers determine the resource requirements to run Antenna. A very complex handler can impact the processing rate.
> Simple object-to-object mapping is a common approach. Augmenting events by calling out to external sources is discouraged.

## Prerequisites

- A Kubernetes cluster
- An IBM Verify tenant: You can sign up for a free trial at [ibm.biz/verify-trial](https://ibm.biz/verify-trial). This will be referenced in this document and in configuration files as `tenant.verify.ibm.com`.

## Configuration

### Setting up the local directory

> 📘 Note
> 
> You will need to perform these steps only if you choose not to clone this Github repository to your local system.

You will build a directory structure that matches [configs](../container-runtime/configs).

Create a directory in your system called `antenna-transmitter` and copy the contents of the [configs](../container-runtime/configs) directory into it. All commands from this point onwards will be executed from the `antenna-transmitter` directory.

Copy the following files into `antenna-transmitter` directory:

- `transmitter-deployment.yaml`: This is the Kubernetes deployment manifest.
- `transmitter-service.yaml`: This is the Kubernetes service manifest.
- `transmitter-pvc.yaml`: This is the persistent volume definition for the SQLite database.

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

#### Configure authorization scheme

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

### Create configmaps and secrets

Using the files in `configs` directory, you will now create configmaps and secrets. The names are very important because they are referenced in the Kubernetes deployment descriptor.

1. Create the configmap for the YAML configuration files

    ```bash
    $ kubectl create configmap transmitter-config \
            --from-file=./configs/transmitter.yml \
            --from-file=./configs/storage.yml \
            --from-file=./configs/processor.yml
    ```

2. Create the configmap for the transformation handlers

    ```bash
    $ kubectl create configmap transmitter-transform-handlers \
            --from-file=configs/js
    ```

3. Create the secret for the TLS certificates

    ```bash
    $ kubectl create secret generic transmitter-keys \
            --from-file=configs/keys
    ```

### Create the Kubernetes deployment

1. Create the PVC

    ```bash
    $ kubectl apply -f transmitter-pvc.yaml
    ```

2. Create the Kubernetes deployment

    ```bash
    $ kubectl apply -f transmitter-deployment.yaml
    ```

3. Create the Kubernetes service

    ```bash
    $ kubectl apply -f transmitter-service.yaml
    ```

### Verify that the transmitter is running

1. Check if the pod is running

    ```bash
    $ kubectl get pods -l app=antenna-transmitter
    ```

2. Port-forward the service to access the transmitter

    ```bash
    $ kubectl port-forward service/antenna-transmitter 9042:9042 9044:9044
    ```

3. Open a browser and verify that you are able to connect to https://{HOSTNAME}:9044/.well-known/ssf-configuration. `{HOSTNAME}` is the hostname of the machine where the transmitter is running.
