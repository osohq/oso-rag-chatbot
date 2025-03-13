# oso-rag-chatbot

A CLI demo app that uses Oso to authorize context vector embeddings before sending them to a RAG chatbot.

## Prerequisites

* [Docker](https://www.docker.com/)
* [Node.js](https://nodejs.org/en)
* An [OpenAI API key](https://platform.openai.com/api-keys) to generate embeddings and chatbot responses.
    * **NOTE:** The requests to OpenAI will incur charges, but they're low. For reference, I made 53 requests to the API while testing this app and incurred USD $0.01 in charges.
* [Supabase local environment]() (installed via npm/docker)
* [Oso Dev Server](https://www.osohq.com/docs/development/oso-dev-server#installation) (installed via docker)

## Quickstart

### Install prerequisites

1. [Docker Desktop](https://www.docker.com/)
1. [node.js](https://nodejs.org/en/download)
1. [Oso Dev Server](https://www.osohq.com/docs/development/oso-dev-server#installation)
    ```bash
    docker run -p '8080:8080' public.ecr.aws/osohq/dev-server:latest
    ```
1. Local Supabase environment
    ```
    npx supabase init
    npx supabase start
    ```

### Clone this repository

__SSH__

```
git clone git@github.com:osohq/oso-rag-chatbot.git 
```

__HTTPS__

```
git clone https://github.com/osohq/oso-rag-chatbot.git
```

### Install repo dependencies

```
cd oso-rag-chatbot
npm install
```

### Initialize the database and Oso Dev Server

```
supabase db reset
npm run initialize
```

### Run the chatbot

```
npm run start
```

## Usage

