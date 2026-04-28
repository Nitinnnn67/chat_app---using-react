# Chat App - React + Capacitor + Supabase

A simple real-time chat application built with React, Capacitor, and Supabase. Features three main screens: Login, Chat List, and Chat.

## Features

- ✅ User authentication with Supabase Auth
- ✅ Real-time messaging with Supabase Realtime
- ✅ View all conversations
- ✅ Send and receive messages in real-time
- ✅ Responsive UI
- ✅ Android support via Capacitor

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (Auth, Database, Realtime)
- **Mobile:** Capacitor
- **Styling:** CSS3

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier works)
- Android Studio (for building APK)
- Java JDK (for Android)

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your `Project URL` and `Anon Key`

### 2. Create Tables

Run these SQL queries in your Supabase SQL editor:

```sql
-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 3. Enable Realtime

1. Go to your Supabase project
2. Click "Realtime" in the left sidebar
3. Click on "messages" table
4. Click "Manage" and enable realtime for all operations

### 4. Create Test Users

Go to Authentication > Users and create a few test users with email/password.

## Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd chat_app---using-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Running Locally

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Building Android APK

### Prerequisites
- Android Studio installed
- Java JDK configured
- ANDROID_HOME environment variable set

### Build Steps

1. **Initialize Capacitor** (if not already done):
```bash
npm install @capacitor/android
npx cap init
```

2. **Build the web app**:
```bash
npm run build
```

3. **Sync with Capacitor**:
```bash
npx cap sync
```

4. **Copy to Android**:
```bash
npx cap copy android
```

5. **Open in Android Studio**:
```bash
npx cap open android
```

6. **Build APK**:
   - In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Wait for the build to complete
   - APK will be in: `android/app/build/outputs/apk/debug/`

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx          # Login screen
│   ├── Login.css
│   ├── ChatList.jsx       # Conversations list
│   ├── ChatList.css
│   ├── Chat.jsx          # Chat screen with real-time
│   └── Chat.css
├── utils/
│   └── supabase.js       # Supabase client configuration
├── App.jsx               # Router setup
├── App.css
├── main.jsx
└── index.css
```

## Screen Details

### Login Screen
- Email and password input
- Error handling for failed logins
- Redirects to Chat List on success

### Chat List Screen
- Shows all conversations for logged-in user
- Displays other person's name and last message
- Tap to open conversation
- Logout button in header

### Chat Screen
- Messages displayed in chronological order
- Sent messages on the right (blue background)
- Received messages on the left (gray background)
- Real-time message updates via Supabase Realtime
- Text input + send button at bottom
- Back button to return to conversation list

## Testing

1. Create test users in Supabase
2. Log in with different users
3. Create conversations by sending messages
4. Verify real-time message delivery

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env.local` file exists in root directory
- Restart dev server after changing environment variables
- Variables should be prefixed with `VITE_` for Vite

### Supabase Connection Errors
- Check Project URL and Anon Key are correct
- Verify Supabase project is active
- Check browser console for detailed errors

### Messages Not Appearing in Real-time
- Verify Realtime is enabled on messages table in Supabase
- Check network connection
- Reload the page

### Android Build Issues
- Ensure Android SDK is properly installed
- Check Java version: `java -version`
- Clear build: `npx cap clean android`

## License

MIT

## Support

For issues and questions, please check the Supabase documentation:
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Capacitor Documentation](https://capacitorjs.com/docs)

