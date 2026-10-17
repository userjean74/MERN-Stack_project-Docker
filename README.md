# Complete step-by-step guide: Make the MERN Stack project work with Docker

This guide walks you through the entire project, from opening your terminal and creating the folders to running the application, testing every feature, and troubleshooting errors.

The goal: Build a working application with React, Node.js, Express, MongoDB, and Docker Compose. You will be able to add items, display saved items, and delete items from a browser.

## How the application will work

1\. React frontend

[http://localhost:5173](http://localhost:5173?utm_source=chatgpt.com)

2\. Express backend

[http://localhost:5000](http://localhost:5000?utm_source=chatgpt.com)

3\. MongoDB database

mongodb://mongo:27017/merndb

Docker Compose runs each component in a separate container and connects them through a shared network.

## Phase 1 — Prepare your computer

### Step 1. Install the required software

Before creating the application, make sure you have:

- Docker Desktop (Windows or macOS), or Docker Engine and the Docker Compose plugin (Linux).
- Node.js and npm, required for creating the React application and optionally running development commands outside Docker.
- A code editor, such as Visual Studio Code.
- A terminal: PowerShell, Command Prompt, macOS Terminal, or Linux terminal.

You can download Docker Desktop from [Docker Desktop](https://www.docker.com/products/docker-desktop/?utm_source=chatgpt.com) and Node.js from [Node.js](https://nodejs.org/?utm_source=chatgpt.com).

### Step 2. Check that the software works

Open your terminal and execute these commands individually:

```
docker --version
docker compose version
node --version
npm --version
```

Each command should display a version number.

Next, start Docker Desktop if you are using it. Verify Docker is running:

```
docker info
```

If this command reports that the Docker daemon is unavailable, start Docker Desktop or the Docker service before continuing.

## Phase 2 — Create the project

### Step 3. Create the root folder

Run:

```
mkdir mern-docker-app
cd mern-docker-app
mkdir backend frontend
```

You are now inside the main project directory.

### Step 4. Create the backend folders

Run:

```
mkdir backend/models
```

Your project will eventually contain these files:

```
mern-docker-app/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   └── models/
│       └── Item.js
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    ├── vite.config.js
    └── src/
        └── App.jsx
```

Important: When a command below says to create a file, save it at exactly the specified path. For example, `backend/server.js` must be inside the `backend` folder, not in the root directory.

## Phase 3 — Build the backend

### Step 5. Create `backend/package.json`

Open your code editor, create `backend/package.json`, and paste the following:

```

{
  "name": "backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "mongoose": "^8.0.0"
  }
}

```

Save the file. It defines the packages the backend needs and the command that starts the server.

### Step 6. Create the MongoDB model

Create `backend/models/Item.js` and paste:

```

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema);

```

This defines the structure of each item stored in MongoDB.

### Step 7. Create the Express server

Create `backend/server.js` and paste this complete implementation:

```

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Item = require('./models/Item');

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://mongo:27017/merndb';

const PORT = process.env.PORT || 5000;

// Check whether the backend is responding.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Retrieve all items, newest first.
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

// Create a new item.
app.post('/api/items', async (req, res) => {
  try {
    const name =
      typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const item = await Item.create({ name });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Delete an item.
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).end();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Start the API only after MongoDB connects successfully.
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

startServer();

```

Save the file.

The server waits for MongoDB before accepting requests. It also handles common API errors instead of allowing them to crash the request handler.

### Step 8. Create the backend Dockerfile

Create a file named `backend/Dockerfile` — no file extension — and paste:

```

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]

```

Docker will use these instructions to build the backend image.

### Step 9. Create the backend `.dockerignore`

Create `backend/.dockerignore`:

```

node_modules
npm-debug.log

```

Save it. This keeps local Node.js dependencies out of the Docker build context.

## Phase 4 — Build the frontend

### Step 10. Generate the React application

From the root folder `mern-docker-app`, run:

```
npm create vite@latest frontend -- --template react
```

If prompted to install the Vite scaffolding tool, confirm the installation. The command should generate the React application inside `frontend`.

If the command refuses to use the existing folder, scaffold the app in a temporary folder and copy its generated contents into `frontend`, without overwriting the backend.

Now install the frontend dependencies:

```
cd frontend
npm install
npm install axios
cd ..
```

You should return to the root project folder after the final command.

### Step 11. Configure Vite's API proxy

Open `frontend/vite.config.js`. Replace its contents with:

```

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
});

```

Save the file.

Why this matters: The browser sends requests to the frontend at `localhost:5173`. Vite forwards `/api` requests to the backend container through Docker's internal network. The hostname `backend` works inside that network, not directly in your browser.

### Step 12. Build the React interface

Open `frontend/src/App.jsx`, remove the existing contents, and paste:

```

import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchItems() {
    try {
      const response = await axios.get('/api/items');
      setItems(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function addItem(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      await axios.post('/api/items', { name: trimmedName });
      setName('');
      await fetchItems();
    } catch (error) {
      setError('Failed to add item.');
    }
  }

  async function deleteItem(id) {
    try {
      await axios.delete(`/api/items/${id}`);
      await fetchItems();
    } catch (error) {
      setError('Failed to delete item.');
    }
  }

  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        maxWidth: 600,
        margin: '40px auto',
        padding: '0 20px'
      }}
    >
      <h1>MERN Docker Demo</h1>
      <p>Add items and save them in MongoDB.</p>

      <form
        onSubmit={addItem}
        style={{ display: 'flex', gap: 8, marginBottom: 20 }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New item name"
          aria-label="New item name"
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: 10,
                borderBottom: '1px solid #eee'
              }}
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => deleteItem(item._id)}
                aria-label={`Delete ${item.name}`}
              >
                Delete
              </button>
            </li>
          ))}

          {items.length === 0 && <p>No items yet — add one above.</p>}
        </ul>
      )}
    </main>
  );
}

export default App;

```

Save the file.

This component loads the items when the page opens, submits new items to Express, and refreshes the list after creating or deleting an item.

### Step 13. Create the frontend Dockerfile

Create `frontend/Dockerfile`:

```

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

```

### Step 14. Create the frontend `.dockerignore`

Create `frontend/.dockerignore`:

```

node_modules
dist

```

Save all frontend files before continuing.

## Phase 5 — Connect everything using Docker Compose

### Step 15. Create `docker-compose.yml`

At the root of your project, create a file named `docker-compose.yml`.

Paste this complete configuration:

```

services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - mern-net
    healthcheck:
      test:
        [
          "CMD",
          "mongosh",
          "--quiet",
          "--eval",
          "db.adminCommand('ping').ok"
        ]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongo:27017/merndb
      PORT: 5000
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - mern-net

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - mern-net

volumes:
  mongo_data:

networks:
  mern-net:
    driver: bridge

```

Save the file.

This configuration:

- Downloads MongoDB version 7.
- Builds the backend from `backend/Dockerfile`.
- Builds the frontend from `frontend/Dockerfile`.
- Connects the services through `mern-net`.
- Waits for MongoDB's health check before starting the backend.
- Persists database files in the `mongo_data` volume.
- Exposes the frontend and backend to your host machine.

The Vite proxy target is configured directly in `vite.config.js`, so a `VITE_API_URL` environment variable is not required for this version.

### Step 16. Verify the file locations

Your directory should now resemble this:

docker-compose.yml

Docker service configuration

backend/package.json

Backend dependencies

backend/server.js

API server

backend/models/Item.js

MongoDB data model

backend/Dockerfile

Backend image instructions

backend/.dockerignore

Backend build exclusions

frontend/package.json

Frontend dependencies

frontend/vite.config.js

Development server and API proxy

frontend/src/App.jsx

React user interface

frontend/Dockerfile

Frontend image instructions

frontend/.dockerignore

Frontend build exclusions

Also verify that `frontend/package.json` exists and contains the React, Vite, and Axios dependencies. The Vite scaffolding command creates this file automatically.

## Phase 6 — Build and start the application

### Step 17. Validate the Docker Compose configuration

From the root directory, run:

```
docker compose config
```

Docker Compose should display the resolved configuration without a YAML or configuration error.

If it reports that it cannot find the Compose file, check that your terminal is in `mern-docker-app` and that the filename is exactly `docker-compose.yml`.

### Step 18. Build and launch all three containers

Run:

```
docker compose up --build
```

Wait for the images to build and the services to start. The first build may take several minutes.

Look for messages indicating that MongoDB has connected and the backend is listening on port 5000. Vite should also report that it is ready.

Keep this terminal open while testing the application.

If a container fails to start, do not continue to the browser tests yet. Use the troubleshooting section below to find the error.

### Step 19. Confirm all containers are running

Open a second terminal window, navigate to the project root, and execute:

```
docker compose ps
```

You should see three services:

- `mongo`
- `backend`
- `frontend`

MongoDB should report a healthy status once its health check passes. The backend and frontend should show as running.

If a service is missing or repeatedly restarting, inspect its logs:

```
docker compose logs --tail=100 mongo
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

## Phase 7 — Test each part of the application

Perform these tests in order so that you can identify which component is failing.

### Step 20. Test the backend health endpoint

In your second terminal, run:

```
curl http://localhost:5000/api/health
```

Expected result:

```
{"status":"ok"}
```

If this works, the backend is accessible from your host machine.

### Step 21. Test the database-backed item endpoint

Run:

```
curl http://localhost:5000/api/items
```

Expected result for a new, empty database:

```
[]
```

If you see an empty array, the backend successfully queried MongoDB.

### Step 22. Create your first item using the API

Run:

```
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"First Docker Item"}'
```

On Windows PowerShell, if `curl` does not behave as expected, use `curl.exe` instead of `curl`.

The API should return an object containing the item name, its MongoDB `_id`, and its creation timestamp. The HTTP status should be `201 Created`.

### Step 23. Confirm that the item was saved

Run the GET request again:

```
curl http://localhost:5000/api/items
```

You should now see `First Docker Item` in the returned array.

This verifies the connection between Express and MongoDB.

### Step 24. Test the React interface

Open a web browser and navigate to:

[Open the MERN application](http://localhost:5173?utm_source=chatgpt.com)

Check the following:

1. The heading `MERN Docker Demo` appears.
2. `First Docker Item` is displayed.
3. You can enter another item name and click Add.
4. The newly created item appears in the list.
5. Clicking Delete removes an item from the list.
6. Refreshing the page does not remove the remaining items.

If the browser cannot connect, confirm that all three services are running before changing any code.

## Phase 8 — Verify persistence and networking

### Step 25. Test whether data survives a restart

This is important because the database must retain its data even when Docker containers stop.

1. Add an item through the browser, such as `Persistent Test`.
2. Stop the containers with:

```
docker compose down
```

3\. Start them again:

```
docker compose up -d
```

4\. Check the services:

```
docker compose ps
```

5\. Open the application again at `http://localhost:5173` and confirm that `Persistent Test` still appears.

The named volume `mongo_data` should preserve the database data between these restarts.

### Step 26. Verify the API through the frontend proxy

The frontend proxy should also forward API requests correctly.

Run:

```
curl http://localhost:5173/api/health
```

Expected response:

```
{"status":"ok"}
```

Then run:

```
curl http://localhost:5173/api/items
```

You should receive the saved item list.

If these requests work, you have verified that the frontend server can proxy requests to the backend, and that the backend can query MongoDB.

## Phase 9 — Troubleshoot common problems

Problem 1: Docker is not running

Typical symptom: Docker reports that it cannot connect to the daemon.

Fix: Start Docker Desktop or the Docker service, then run `docker info` again.

Problem 2: MongoDB connection fails

Typical symptom: `MongoNetworkError` or a connection refusal in the backend logs.

Fix: Confirm that the backend uses `mongodb://mongo:27017/merndb`, then check `docker compose logs mongo backend`. Do not replace `mongo` with `localhost`.

Problem 3: The frontend cannot load items

Typical symptom: `Failed to load items` appears in the browser.

Fix: Check the backend logs and verify that `vite.config.js` proxies `/api` to `http://backend:5000`. After changing Docker configuration, rebuild with `docker compose up --build`.

Problem 4: Port already in use

Typical symptom: Docker cannot bind port 5173, 5000, or 27017.

Fix: Stop the application or another service using the conflicting port, or change the host-side port mapping in `docker-compose.yml`.

Problem 5: Changes do not appear

Typical symptom: Updated source code does not appear in the browser.

Fix: For the setup in this guide, try `docker compose up --build --force-recreate`. If the browser still shows old content, check the frontend logs and ensure you edited the correct file.

Problem 6: Items disappear after cleanup

Typical symptom: The database is empty after stopping the application.

Fix: Use `docker compose down` without the `-v` option. The command `docker compose down -v` deletes the named volume and its stored data.

## Phase 10 — Commands you will use regularly

Keep this reference handy when working on the project.

| Task                            | Command                                      |
| ------------------------------- | -------------------------------------------- |
| Start and build                 | `docker compose up --build`                  |
| Start in background             | `docker compose up -d`                       |
| Check containers                | `docker compose ps`                          |
| View all logs                   | `docker compose logs -f`                     |
| View backend logs               | `docker compose logs -f backend`             |
| Stop containers                 | `docker compose down`                        |
| Rebuild after changes           | `docker compose up --build --force-recreate` |
| Stop and delete database volume | `docker compose down -v`                     |

## Final completion checklist

## Project verification

0 of 10

Docker and Compose are installed and running

Backend connects to MongoDB successfully

GET /api/health returns status ok

GET /api/items returns the stored items

POST /api/items creates a new item

The React interface displays and adds items

The Delete button removes an item

Frontend API proxy works

All three containers run successfully

Database data persists after a restart

The most important rule: Build and verify the backend, frontend, and database connections in sequence. Do not move to troubleshooting the frontend until the backend health endpoint works, and do not consider the project finished until creating, deleting, and retaining data after a restart all work correctly.
