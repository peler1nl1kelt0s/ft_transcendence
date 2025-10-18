# ft_transcendence

**ft_transcendence** is a real-time multiplayer web application that combines social features and live gameplay. The project implements a full stack architecture: a backend that handles authentication, matchmaking, friend requests and game state, and a responsive frontend for playing ping-pong, chatting, and managing friends. Real-time interactions are powered by WebSockets.

## Highlights / Features
- User authentication & profiles  
- Friend requests, friend list and presence status  
- Real-time chat (global and game room chat)  
- Real-time multiplayer **Ping-Pong** (game state sync via WebSockets)  
- Matchmaking / invitations for 1v1 games  
- Persistent game history and player stats (stored in PostgreSQL)  
- Dockerized services for easy local setup and deployment

## Tech stack
- **Backend:** Django (or your chosen web framework) + REST APIs  
- **Real-time:** WebSockets (Django Channels / socket.io / native websockets)  
- **Database:** PostgreSQL  
- **Frontend:** JavaScript + Bootstrap (vanilla or small framework)  
- **DevOps:** Docker / docker-compose for local development, optional CI pipelines for tests and builds

> If you use specific libraries (Django Channels, Socket.IO, React, etc.) replace the generic names above with the exact packages.

## Architecture (high level)
1. **HTTP REST API** — authentication, user/profile endpoints, friend management, match history.  
2. **WebSocket server** — handles live game state, chat messages, matchmaking events, and presence updates.  
3. **Database (Postgres)** — stores users, friendships, game results, and stats.  
4. **Frontend** — client connects to REST API for data and WebSocket for real-time events; renders game canvas and chat UI.

## Prerequisites
- Docker & docker-compose (recommended)  
- Git  
- (Optional) Python 3.10+, pip, virtualenv — if you prefer to run backend locally without Docker  
- (Optional) Node.js & npm/yarn — if the frontend has a build step

## Quickstart — Docker (recommended)
> The repo includes `docker-compose.yml`. If yours has different file names, adjust the commands below.

1. **Clone**
```bash
git clone https://github.com/peler1nl1kelt0s/ft_transcendence.git
cd ft_transcendence
