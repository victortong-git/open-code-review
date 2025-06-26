# MCP Server Feature Plan

## 1. Project Structure and Dependencies

A new directory `mcp_server` will be created at the root of the project. This directory will contain:

- **`main.py`**: The entry point for the MCP server, responsible for setting up the FastAPI application and defining the API endpoints.
- **`mcp_tools.py`**: A dedicated module to house the business logic for each MCP tool. This will include functions for retrieving source code, creating findings, and performing code analysis.
- **`Dockerfile`**: A new Dockerfile to build the MCP server image, ensuring it has all the necessary dependencies.
- **`requirements.txt`**: A file listing the Python dependencies for the MCP server, such as `fastapi`, `uvicorn`, and `requests`.

## 2. Docker Compose Integration

The `docker-compose.yml` file will be updated to include the new `mcp_server` service. This will ensure that the MCP server starts up alongside your other services and can communicate with the backend and other components of your application.

## 3. MCP Server Implementation

The MCP server will be built using **FastAPI**, a modern, high-performance Python web framework that supports asynchronous request handling. This will allow the server to handle multiple requests concurrently, making it highly efficient and scalable.

The server will expose the following endpoints:

- **`GET /mcp/source_code/{file_id}`**: Retrieves the source code for a given file ID.
- **`POST /mcp/findings`**: Creates a new finding record in the database.
- **`POST /mcp/analyze`**: Triggers a code analysis for a given file ID and review type.

## 4. Tool Implementation

The core logic of your existing `open_code_review` agent will be extracted and refactored into a new set of tools within the `mcp_tools.py` module. These tools will be designed to be modular and reusable, and will be exposed through the MCP server's API.

## 5. Refactoring the Existing Agent

The existing `open_code_review` agent will be refactored to use the new MCP server instead of implementing the logic directly. This will involve updating the agent's code to make HTTP requests to the MCP server's API endpoints.
