# Open Code Review

A robust code review platform powered by NVIDIA AgentIQ Toolkit, designed for analyzing code repositories with AI-assisted security reviews and recommendations.

## Overview

Open Code Review is a proof-of-concept (POC) build created for the Nvidia Hackathon. It provides a modern web interface for performing automated security code reviews using AI agents.

## Features

- **Project Dashboard:** View project statistics, including file counts, scanning status, and security risk distributions
- **File Management:** View, scan, and manage files within projects
- **Findings Analysis:** View and manage security findings from AI code reviews
- **AI-Powered Code Scanning:** Leverages NVIDIA AgentIQ Toolkit for intelligent code analysis
- **Interactive UI:** Modern, responsive UI built with React, TypeScript and Tailwind CSS

## Architecture

The application consists of:

- **Frontend:** React.js with TypeScript and Tailwind CSS
- **Backend:** Node.js/Express API server
- **Database:** PostgreSQL for storing projects, files, and findings
- **AI Integration:** NVIDIA AgentIQ Toolkit for code analysis

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for development)

### Running with Docker

```bash
# Clone the repository
git clone https://github.com/victortong-git/open-code-review.git
cd open-code-review

# Start all services with Docker Compose
docker-compose up -d
```

The application will be available at http://localhost:5173

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## License

This project is available under the MIT License. See the LICENSE file for more information.

## Contact

Developed by Victor Tong - [GitHub](https://github.com/victortong-git) | [LinkedIn](https://www.linkedin.com/in/vsctong)

---

Powered by [NVIDIA AgentIQ Toolkit](https://docs.nvidia.com/agentiq/latest/index.html)
