# MERN-Screen-Recorder-Take-Home-Assignment
MERN Screen Recorder Take-Home Assignment 
# Screen Recorder App - MERN Stack

A full-stack web application that allows users to record their browser tab's screen with microphone audio, preview recordings, download them, and upload to a backend server for storage and playback.

## 🌟 Features

- **Tab Screen Recording**: Record active browser tab with audio using WebRTC APIs
- **Audio Integration**: Captures both system audio and microphone input
- **Time Limits**: Maximum 3-minute recording duration with live timer
- **Preview & Download**: Instant playback and download of recordings
- **Cloud Storage**: Upload recordings to backend with metadata
- **Recordings Library**: View all uploaded recordings with inline playback
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Live Demo

- **Frontend**: [Your Vercel/Netlify URL]
- **Backend**: [Your Render URL]

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **WebRTC APIs** - Screen capture (getDisplayMedia, MediaRecorder)
- **CSS3** - Modern styling with glassmorphism effects
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database for metadata storage
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
screen-recorder-app/
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   └── package.json
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── uploads/ (created automatically)
└── README.md
```

## 🔧 Local Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern browser (Chrome recommended for best compatibility)

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   git clone <your-repo-url>
   cd screen-recorder-app/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables**:
   Create `.env` file:
   ```bash
   REACT_APP_API_BASE_URL=http://localhost:5000
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

   App will run on `http://localhost:3000`

## 🌐 Deployment

### Backend Deployment (Render)

1. **Connect your GitHub repo to Render**
2. **Create a new Web Service**
3. **Configure settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave blank for auto-assignment)

### Frontend Deployment (Vercel/Netlify)

#### Vercel:
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Navigate to frontend**: `cd frontend`
3. **Deploy**: `vercel --prod`
4. **Environment Variables**: Set `REACT_APP_API_BASE_URL` to your backend URL

#### Netlify:
1. **Build the app**: `npm run build`
2. **Drag and drop** the `build` folder to Netlify
3. **Environment Variables**: Set `REACT_APP_API_BASE_URL` in site settings

## 📱 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Screen Capture | ✅ | ✅ | ⚠️ | ✅ |
| Audio Capture | ✅ | ✅ | ⚠️ | ✅ |
| MediaRecorder | ✅ | ✅ | ⚠️ | ✅ |

**Note**: Chrome provides the best experience. Safari has limited support for screen recording APIs.

## 🔒 Security Considerations

- File uploads are limited to 100MB
- Only video file types are accepted
- CORS is configured for cross-origin requests
- SQLite database is file-based (consider PostgreSQL for production)

## ⚙️ API Endpoints

### GET `/api/recordings`
Get all recordings metadata

### POST `/api/recordings`
Upload a new recording
- **Body**: FormData with `recording` file and metadata

### GET `/api/recordings/:id`
Stream/download a specific recording (supports range requests)

### DELETE `/api/recordings/:id`
Delete a recording and its file

### GET `/health`
Health check endpoint

## 🚨 Known Limitations

1. **Browser Permissions**: Users must grant screen capture and microphone permissions
2. **File Size**: Large recordings may take time to upload depending on connection
3. **Storage**: Files are stored locally on server (consider cloud storage for production)
4. **Mobile Support**: Limited screen recording support on mobile browsers
5. **Safari**: Reduced functionality due to WebRTC API limitations

## 🔄 Future Enhancements

- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] User authentication and private recordings
- [ ] Recording compression options
- [ ] Thumbnail generation
- [ ] Sharing capabilities
- [ ] Recording editing features
- [ ] Mobile app version

## 🐛 Troubleshooting

### Common Issues:

1. **"Recording not supported"**: Ensure you're using HTTPS in production and a supported browser
2. **Upload fails**: Check file size limits and backend server status
3. **No audio**: Verify microphone permissions are granted
4. **CORS errors**: Ensure backend CORS is configured for your frontend domain

### Debug Steps:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check backend logs
4. Ensure all environment variables are set correctly

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👨‍💻 Author

**Your Name**
- GitHub: [@your-username]((https://github.com/Harinajm))
- LinkedIn: [Your LinkedIn](linkedin.com/in/harina-jm-2bbb89241)

## 🙏 Acknowledgments

- WebRTC community for excellent documentation
- React team for the amazing framework
- Express.js for the robust backend framework
