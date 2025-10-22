# Admin User Management

This directory contains scripts for managing admin users in Egfilm.

## Scripts

### 1. Make a User Admin

Promote an existing user to admin role:

```bash
npm run admin:make <email>
```

**Example:**
```bash
npm run admin:make john@example.com
```

This will:
- Find the user by email
- Update their role to "admin"
- Grant them access to `/admin` panel

### 2. List All Users

View all users and their roles:

```bash
npm run admin:list
```

This will display:
- User email, name, and role
- Account status (active/banned)
- Creation date
- Summary statistics (total admins, moderators, users)

## User Roles

The system supports three roles:

- **`user`** (default): Regular user with access to movies, watchlist, etc.
- **`moderator`**: Can moderate content (future feature)
- **`admin`**: Full access to admin panel and all features

## Admin Panel Access

Once a user has the `admin` role:

1. Login to your account
2. Navigate to `/admin`
3. You'll have access to:
   - User management
   - Content management
   - Blog management (create/edit/publish posts)
   - Watch rooms
   - Analytics
   - System notifications
   - Settings

## Database Schema

The `User` model includes:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")  // 'user', 'admin', 'moderator'
  isActive  Boolean  @default(true)
  isBanned  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... relations
}
```

## Security Notes

- Admin role is checked from the database on every request
- No environment variables needed for admin access
- Sessions include the user's role via JWT tokens
- All admin API routes verify the role server-side
- Role cannot be changed through the UI (only via scripts or database)

## Creating Your First Admin

1. Register a new account at `/register`
2. Run the make-admin script with your email:
   ```bash
   npm run admin:make your-email@example.com
   ```
3. Refresh your browser
4. Navigate to `/admin`

## Troubleshooting

**"User not found"**
- Make sure you've registered an account first
- Double-check the email spelling

**"Already an admin"**
- User is already promoted, no action needed

**Can't access /admin after promotion**
- Clear your browser cache and cookies
- Log out and log back in to refresh the session
- Check the browser console for errors

## Manual Database Access

You can also use Prisma Studio:

```bash
npm run db:studio
```

Then navigate to the `User` table and change the `role` field to `"admin"`.
