# Fix Database Connection String Errors

If you're getting an error like:
```
Database connection failed: The provided database string is invalid. 
Error parsing connection string: invalid domain character in database URL.
```

This usually means your database password (or other parts of the connection string) contains special characters that need to be URL-encoded.

## ✨ Automatic Encoding (Recommended)

**Good news!** The code now automatically handles URL encoding of passwords with special characters. You can use your DATABASE_URL as-is from Supabase, and the system will automatically encode it properly.

If you're still getting errors after updating your code, try the manual encoding options below.

## 🔧 Manual Fix (If Automatic Encoding Fails)

### Option 1: URL-encode your password manually

If your password contains special characters like `@`, `:`, `/`, `#`, `?`, `&`, `=`, `%`, or spaces, you need to encode them.

**Common character encodings:**
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `#` → `%23`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`
- `%` → `%25`
- Space → `%20`

**Example:**
If your password is `MyP@ssw0rd:123`, your DATABASE_URL should be:
```
DATABASE_URL="postgresql://postgres:MyP%40ssw0rd%3A123@db.xxxxx.supabase.co:5432/postgres"
```

### Option 2: Use an online URL encoder

1. Go to https://www.urlencoder.org/
2. Paste your password in the encoder
3. Copy the encoded result
4. Replace your password in the DATABASE_URL with the encoded version

### Option 3: Use JavaScript to encode (in browser console)

```javascript
// Just encode the password part
encodeURIComponent('MyP@ssw0rd:123')
// Returns: "MyP%40ssw0rd%3A123"
```

## 📝 Format for Supabase

Your DATABASE_URL should look like this:

```
postgresql://postgres:[ENCODED_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?sslmode=require
```

**Where to find your Supabase connection string:**
1. Go to https://supabase.com
2. Open your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** → **URI**
5. Copy the connection string
6. **Note**: The code will automatically encode special characters, but you can encode manually if needed

## ✅ Automatic Features

The code automatically:
- **Encodes passwords** with special characters (`@`, `:`, `/`, `#`, `?`, `&`, `=`, `%`, spaces, etc.)
- **Adds `sslmode=require`** if missing
- **Handles malformed URLs** gracefully
- **Works with passwords containing** `@` or `:` characters

If you're still having issues after the automatic encoding:
1. Double-check that your password is properly encoded
2. Ensure there are no extra spaces in the DATABASE_URL
3. Make sure the URL is wrapped in quotes in your `.env` file:
   ```
   DATABASE_URL="postgresql://..."
   ```

## 🔍 Testing

After updating your DATABASE_URL, test the connection by:
1. Restarting your development server
2. Visiting `/api/health-db` endpoint
3. Or running: `npx prisma db push` or `npx prisma migrate dev`

## 🐛 Debugging in Vercel

If you're still getting errors after deployment:

1. **Check your DATABASE_URL in Vercel:**
   - Go to your Vercel project
   - Click **Settings** → **Environment Variables**
   - Find `DATABASE_URL` and check its value
   - Make sure there are no extra spaces or quotes

2. **Common issues:**
   - ✅ **Correct**: `postgresql://postgres:password@host:5432/db?sslmode=require`
   - ❌ **Wrong**: `DATABASE_URL="postgresql://..."` (no quotes in Vercel env vars)
   - ❌ **Wrong**: `postgresql://postgres:password with spaces@host:5432/db`
   - ❌ **Wrong**: Extra spaces before/after the URL

3. **If password has special characters:**
   - The code now automatically encodes them
   - But if issues persist, try manually encoding just the password:
     ```javascript
     // In browser console or Node.js
     const password = 'your-password-with-@-and-:';
     const encoded = encodeURIComponent(password);
     console.log(encoded);
     ```
   - Then rebuild your connection string with the encoded password

4. **Verify URL format:**
   - Must start with `postgresql://` or `postgres://`
   - Format: `protocol://username:password@host:port/database?params`
   - Check for any illegal characters in hostname or database name

