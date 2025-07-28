# WhatsApp Campaign Management App

A full-stack web application for managing WhatsApp campaigns with React + Tailwind frontend and Node.js + Express + MongoDB backend.

## 🚀 Features

### 🔐 Authentication
- User registration and login with JWT
- Secure password hashing with bcrypt
- Protected routes and middleware

### 📱 WhatsApp Session Management
- Unique WPPConnect sessions per user
- QR code generation and scanning
- Real-time connection status
- Session persistence in MongoDB

### 💬 Chat Management
- View individual chats and groups
- Export contacts to CSV
- Real-time chat loading
- Group member management
- Smart name fallbacks (no more "Unknown")

### 📣 Campaign Management
- Create and send message campaigns
- Support for individual numbers and groups
- Anti-block timer system (1-10 seconds)
- Delivery status tracking
- Campaign history and analytics

### 🎨 Beautiful UI
- Modern sidebar navigation
- Gradient color schemes
- Smooth animations with Framer Motion
- Responsive design
- Loading states and notifications

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- WPPConnect server running on port 21465

## ⚙️ Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd whatsapp-campaign-app
```

2. **Install dependencies:**
```bash
npm run install-all
```

3. **Configure environment variables:**

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/whatsapp-campaign
JWT_SECRET=your-super-secret-jwt-key-here
WPPCONNECT_API_URL=http://localhost:21465
WPPCONNECT_SECRET_KEY=THISISMYSECURETOKEN
```

4. **Start the application:**
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:5173

## 🎯 Usage

1. **Register/Login:** Create an account or sign in
2. **Create WhatsApp Session:** Enter session name and scan QR code
3. **View Chats:** Browse your individual chats and groups
4. **Create Campaigns:** Send bulk messages with anti-block delays
5. **Monitor Results:** Track delivery status and campaign analytics

## 📊 Database Structure

### Users Collection
```javascript
{
  email: String,
  password: String (hashed),
  sessionName: String,
  whatsappToken: String,
  isWhatsappConnected: Boolean
}
```

### UserData Collection
```javascript
{
  userId: ObjectId,
  chats: [{ id, name, phone, lastUpdated }],
  groups: [{ id, name, members: [{ id, phone }], memberCount }],
  lastSyncAt: Date
}
```

### Campaigns Collection
```javascript
{
  userId: ObjectId,
  name: String,
  message: String,
  recipients: [{ phone, name, isGroup }],
  status: String,
  results: [{ recipient, status, sentAt, error }]
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### WhatsApp
- `POST /api/whatsapp/generate-token` - Generate WPP token
- `POST /api/whatsapp/start-session` - Start WhatsApp session
- `GET /api/whatsapp/qr-code` - Get QR code image
- `GET /api/whatsapp/status` - Check connection status
- `GET /api/whatsapp/chats` - Get user chats
- `GET /api/whatsapp/groups` - Get user groups
- `POST /api/whatsapp/sync-all` - Sync all data
- `POST /api/whatsapp/send-message` - Send message

### Campaigns
- `GET /api/campaigns` - Get user campaigns
- `POST /api/campaigns` - Create new campaign
- `POST /api/campaigns/:id/send` - Send campaign
- `GET /api/campaigns/:id` - Get campaign details

## 🎨 Color Themes

- **Dashboard:** Blue to purple gradients
- **Chats:** Green to blue gradients  
- **Campaigns:** Purple to pink gradients
- **Create Campaign:** Orange to red gradients
- **Login:** Blue to purple theme
- **Register:** Purple to pink theme

## 🚀 Performance Features

- **MongoDB persistence** - Data never expires
- **Smart syncing** - Only updates when needed (5 min intervals)
- **Instant loading** - Cached data loads immediately
- **Background sync** - Updates data silently
- **Rate limiting** - Prevents API overload

## 🔒 Security Features

- **JWT authentication** with secure tokens
- **Password hashing** with bcrypt
- **Protected API routes**
- **CORS configuration**
- **Input validation**

## 📱 Mobile Responsive

- **Collapsible sidebar** on mobile
- **Touch-friendly buttons**
- **Responsive grid layouts**
- **Mobile-first design**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and MongoDB**
