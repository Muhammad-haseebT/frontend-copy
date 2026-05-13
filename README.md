# BIIT Sports Frontend

A comprehensive sports management platform built with React and Vite, designed to manage tournaments, matches, teams, players, and statistics for various sports including Cricket, Football, Basketball, and Volleyball.

## 🎯 Project Overview

BIIT Sports Frontend is a modern web application that provides a complete ecosystem for managing sports activities at BIIT (Bilquis Institute of Information Technology). The platform enables administrators to create and manage tournaments, track live matches, view player statistics, and handle account management across multiple sports.

## ✨ Key Features

### 🏆 Tournament Management
- **Create & Edit Tournaments**: Full-featured tournament creation with customizable options
  - Multiple tournament stages (Round Robin, Knock Out, League, Mixed)
  - Player type selection (Male/Female)
  - Tournament type configuration (Hard/Tennis)
  - Date range management
  - Organizer assignment
- **Tournament Overview**: Detailed tournament information with tabs for:
  - Overview & Summary
  - Fixtures & Match Schedules
  - Points Table
  - Team Management
  - Statistics
  - Media Gallery

### 📊 Match Management
- **Live Match Tracking**: Real-time display of ongoing matches
- **Upcoming Matches**: Schedule view with date and time information
- **Match Details**: Comprehensive match information with team details
- **Status Filtering**: Filter matches by status (Live, Upcoming, Completed)
- **Sport-Based Filtering**: View matches by specific sport

### 👥 Player & Team Management
- **Player Statistics**: Sport-specific player performance tracking
  - Cricket stats (Batting, Bowling, Fielding)
  - Coming soon for other sports
- **Team Rosters**: Complete team management with player listings
- **Player Search**: Live search and auto-filter functionality
- **Request Management**: Handle player and team join requests

### 📈 Statistics & Analytics
- **Player Performance Stats**: Detailed cricket statistics including:
  - Batting: Runs, Average, Strike Rate, Boundaries
  - Bowling: Wickets, Economy, Average, Strike Rate
  - Fielding: Catches, Run Outs, Stumpings
- **Tournament Statistics**: Sport-specific tournament analytics
- **Performance Tracking**: Historical performance data

### 🎨 Media Management
- **Media Gallery**: Tournament and match media with pagination
- **Image Viewer**: Full-screen media viewer with navigation
- **Batch Loading**: Efficient loading (6 images per batch)
- **Upload Support**: Media upload for tournaments and matches

### 👤 Account Management
- **User Authentication**: Secure login system with cookies
- **Role-Based Access**: Different views for players and administrators
- **Account Administration**: Admin panel for managing user accounts
- **My Scorer**: Personal scoring dashboard

## 🛠️ Technology Stack

### Core Technologies
- **React** (v19.2.0) - UI framework
- **Vite** (v6.0.0) - Build tool and dev server
- **React Router DOM** (v7.12.0) - Client-side routing

### Styling & UI
- **Tailwind CSS** (v4.1.18) - Utility-first CSS framework
- **Lucide React** (v0.562.0) - Modern icon library
- **React Icons** (v5.5.0) - Additional icon sets
- **React Feather** (v2.0.10) - Feather icons

### State Management & Data
- **Axios** (v1.13.2) - HTTP client for API requests
- **js-cookie** (v3.0.5) - Cookie management

### User Experience
- **React Toastify** (v11.0.5) - Toast notifications
- **SweetAlert2** (v11.26.17) - Beautiful alerts and modals

### Development Tools
- **ESLint** (v9.39.1) - Code linting
- **PostCSS** (v8.5.6) - CSS processing
- **Autoprefixer** (v10.4.23) - CSS vendor prefixes

## 📁 Project Structure

```
biit-sports-frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API service layer
│   │   ├── accountsApi.js
│   │   ├── authApi.js
│   │   ├── matchApi.js
│   │   ├── mediaApi.js
│   │   ├── playerApi.js
│   │   ├── playerRequestApi.js
│   │   ├── seasonApi.js
│   │   ├── statsApi.js
│   │   ├── teamApi.js
│   │   └── tournamentAPi.js
│   │
│   ├── assets/         # Images and static files
│   │   └── banner.png
│   │
│   ├── components/     # Reusable React components
│   │   ├── AdminTeamRequests.jsx
│   │   ├── CricketPlayerStats.jsx
│   │   ├── DrawerMenu.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MatchCard.jsx
│   │   ├── MediaViewer.jsx
│   │   ├── Navbar.jsx
│   │   ├── PlayerRequests.jsx
│   │   ├── PlayerStats.jsx
│   │   ├── SportFilter.jsx
│   │   ├── StatusFilter.jsx
│   │   ├── TournamentDetailComponent.jsx
│   │   ├── TournamentFixtures.jsx
│   │   ├── TournamentOverview.jsx
│   │   ├── TournamentPoints.jsx
│   │   ├── TournamentStats.jsx
│   │   ├── TournamentStatsTab.jsx
│   │   ├── TournamentTeams.jsx
│   │   └── UpdateAccount.jsx
│   │
│   ├── pages/          # Page components
│   │   ├── CreateTournament.jsx
│   │   ├── DetailedTournament.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── ManageAccounts.jsx
│   │   ├── Matches.jsx
│   │   ├── MyScorer.jsx
│   │   ├── Request.jsx
│   │   ├── Seasons.jsx
│   │   ├── SportSelection.jsx
│   │   ├── Sports.jsx
│   │   ├── Stats.jsx
│   │   ├── TournamentDetail.jsx
│   │   ├── Welcome.jsx
│   │   └── sport_tournamentDetail.jsx
│   │
│   ├── routes/         # Application routing
│   │   └── AppRoutes.jsx
│   │
│   ├── App.css         # Application styles
│   ├── App.jsx         # Root component
│   ├── index.css       # Global styles
│   └── main.jsx        # Application entry point
│
├── .env                # Environment variables
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json         # Vercel deployment config
└── vite.config.js      # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- Backend API server running (default: https://mhaseeb-t-fyp.hf.space)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Muhammad-haseebT/biit-sports-frontend.git
   cd biit-sports-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create or update the `.env` file in the root directory:
   ```env
   VITE_BASE_URL=https://mhaseeb-t-fyp.hf.space
   # For local development:
   # VITE_BASE_URL=http://localhost:7860
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint for code quality

## 🌐 API Integration

The application integrates with a backend REST API for all data operations. The base URL is configured via the `VITE_BASE_URL` environment variable.

### API Modules

- **Authentication API** (`authApi.js`)
  - User login and session management
  
- **Tournament API** (`tournamentAPi.js`)
  - Create, read, update tournaments
  - Get tournament overview and points
  
- **Match API** (`matchApi.js`)
  - Fetch matches by status
  - Filter matches by sport and status
  
- **Stats API** (`statsApi.js`)
  - Retrieve player statistics
  - Tournament-level analytics
  
- **Player API** (`playerApi.js`)
  - Player information and management
  
- **Team API** (`teamApi.js`)
  - Team data and roster management
  
- **Media API** (`mediaApi.js`)
  - Media upload and retrieval
  - Paginated media galleries
  
- **Accounts API** (`accountsApi.js`)
  - User account management
  
- **Season API** (`seasonApi.js`)
  - Sports season management
  
- **Player Request API** (`playerRequestApi.js`)
  - Handle player join requests

## 🎨 Design System

### Color Scheme
- **Primary**: Red (#DC2626 - red-600)
- **Background**: Gray (#F3F4F6 - gray-100)
- **Cards**: White (#FFFFFF)
- **Text**: Dark Gray (#1F2937 - gray-800)
- **Accents**: Various shades of red for emphasis

### Components
- **Consistent Button Styling**: Red primary buttons with hover effects
- **Loading States**: Custom loading spinner component
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Icon System**: Unified `lucide-react` icon library
- **Card Hover Effects**: Subtle elevation and shadow transitions
- **Typography**: System fonts with proper hierarchy

## 📱 Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Welcome | Landing page |
| `/login` | Login | User authentication |
| `/home` | Home | Main dashboard with live & upcoming matches |
| `/sports` | Sports | Sports selection and management |
| `/seasons` | Seasons | Season management |
| `/matches` | Matches | All matches view |
| `/stats` | Stats | Player statistics |
| `/tournament-detail` | TournamentDetail | Tournament information |
| `/detailed-tournament` | DetailedTournament | Comprehensive tournament view |
| `/sport-tournament-detail` | SportTournamentDetail | Sport-specific tournament details |
| `/create-tournament` | CreateTournament | Tournament creation/editing |
| `/sports-selection` | SportSelection | Sport selection interface |
| `/manage-accounts` | ManageAccounts | Admin account management |
| `/my-scorer` | MyScorer | Personal scoring dashboard |
| `/request` | Request | Player/team request management |

## 🔐 Authentication

The application uses cookie-based authentication:
- User credentials stored in `js-cookie`
- Session persistence across page reloads
- Role-based UI rendering (Player/Admin)
- Automatic redirect to login for protected routes

## 📦 Deployment

### Vercel (Recommended)
The project is configured for Vercel deployment with SPA routing support.

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Add `VITE_BASE_URL` in Vercel dashboard
   - Set to production API endpoint

### Manual Build
```bash
npm run build
```
The build output will be in the `dist/` directory.

## 🧩 Key Components

### LoadingSpinner
Reusable loading indicator with size variants (small, medium, large)

### Navbar
Top navigation with:
- User profile display
- Search functionality
- Drawer menu for navigation

### MatchCard
Displays match information with:
- Tournament name
- Team names
- Match status/time
- Live indicator

### MediaViewer
Full-screen media viewer with:
- Image navigation (prev/next)
- Close functionality
- Touch/swipe support

### TournamentOverview
Tabbed interface for tournament details:
- Overview, Fixtures, Points, Teams, Stats, Media

### PlayerStats
Sport-specific statistics display:
- Cricket (detailed stats)
- Other sports (coming soon UI)

## 🔄 State Management

The application uses React's built-in state management:
- **useState** for local component state
- **useEffect** for side effects and data fetching
- **useNavigate/useLocation** for routing state
- **Cookies** for persistent authentication state

## 🐛 Known Issues & Solutions

### Vite Not Recognized
If you encounter "vite is not recognized" error:
```bash
npm install
npm run dev
```

### API Connection Issues
Ensure backend API is running and `.env` file has correct `VITE_BASE_URL`

## 🤝 Contributing

This is a Final Year Project for BIIT. For contributions or issues:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 👨‍💻 Developer

**Muhammad Haseeb**
- GitHub: [@Muhammad-haseebT](https://github.com/Muhammad-haseebT)
- Project: Final Year Project (FYP) - BIIT

## 📄 License

This project is part of an academic final year project.

## 🙏 Acknowledgments

- Built with React and Vite
- Styled with Tailwind CSS
- Icons from Lucide React
- Backend API hosted on Hugging Face Spaces

---

**Last Updated**: January 2026
**Version**: 0.0.0
**Status**: Active Development
