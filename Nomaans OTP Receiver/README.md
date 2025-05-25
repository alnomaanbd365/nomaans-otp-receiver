# Nomaans OTP Receiver

A professional OTP receiving application that supports multiple services including Facebook and Telegram. Built with React.js and Node.js.

## Features

- Real-time OTP receiving using WebSocket
- Support for multiple services (Facebook, Telegram)
- Modern and responsive UI
- Copy to clipboard functionality
- Search and filter capabilities
- Automatic refresh
- Toast notifications
- Error handling and logging

## Tech Stack

### Frontend
- React.js
- React Bootstrap
- Socket.IO Client
- React Icons
- React Toastify
- Date-fns

### Backend
- Node.js
- Express.js
- Socket.IO
- Winston Logger
- Express Rate Limiter

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PREMIUMY_API_KEY=your_api_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with:
```
REACT_APP_SERVER_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `PREMIUMY_API_KEY`
   - `CLIENT_URL` (your frontend URL)
   - `PORT` (optional, defaults to 5000)

### Frontend Deployment (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
4. Add environment variables:
   - `REACT_APP_SERVER_URL` (your backend URL)

## Security Considerations

- API keys are stored in environment variables
- Rate limiting is implemented
- CORS is properly configured
- Error messages are sanitized in production

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 