# Source Code Review Panel Frontend

This is the frontend for the Source Code Review Panel, built with React, TypeScript, Redux, and Tailwind CSS.

## Features

- **Project Dashboard:** View project statistics, including file counts, scanning status, and risk distributions
- **File Management:** View, scan, and manage files within projects
- **Findings Analysis:** View and manage security findings from AI code reviews
- **Interactive UI:** Modern, responsive UI built with Tailwind CSS

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Docker

To run the frontend in a Docker container:

```bash
# Build the Docker image
docker build -t open-code-review-frontend .

# Run the container
docker run -p 5173:5173 open-code-review-frontend
```

## Project Structure

- `src/components`: Reusable UI components
- `src/features`: Redux slices for state management
- `src/pages`: Page components
- `src/services`: API service functions
- `src/store`: Redux store configuration
- `src/styles`: Global styles with Tailwind

## Key Components

- **ProjectList:** Landing page showing all available projects
- **Dashboard:** Project dashboard showing metrics and files
- **FileScan:** Detailed view of file scanning results and findings

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
