
## Setup
```bash
git clone [https://github.com/ttithipan/67011671-Todo.git](https://github.com/ttithipan/67011671-Todo.git)
cd frontend
npm install
cd ../backend
npm install
npm run setup
```

In ```/backend```, make a ```.env``` file with the following varables.
```
# --- Database Configuration ---
MYSQL_VERSION=8.0       # e.g., 8.0 or latest
MYSQL_ROOT_PASSWORD=    # Root password for MySQL
MYSQL_DATABASE=         # Database name (e.g., todo_app)
MYSQL_USER=             # Username for database access
MYSQL_PASSWORD=         # Password for the database user
PMA_HOST_PORT=          # Port for phpMyAdmin (e.g., 8080)
DB_HOST=                # Database host (usually 'localhost')
DB_PORT=                # Database port (usually '3306')

# --- API Server Configuration ---
API_HOST=localhost      # Hostname for the Node server
API_PORT=5001           # Port for the Node server
FRONTEND_PORT=5501      # Port where the React app runs (for CORS)

# --- Security Secrets ---
SESSION_SECRET=         # Random string to sign session cookies (e.g., 'super-secret-key')
GOOGLE_CLIENT_ID=       # OAuth 2.0 Client ID from Google Cloud Console
GOOGLE_CLIENT_SECRET=   # OAuth 2.0 Client Secret from Google Cloud Console
RECAPTCHA_SECRET_KEY=   # reCAPTCHA Secret Key (v2 Checkbox) from Google Admin
```

In  ```/frontend```, make a ```.env``` file with the following variables.
```
VITE_API_HOST=              #Fill in hostname from API_HOST.
VITE_API_PORT=              #Fill in port number from API_PORT.
PORT=                       #Fill in port number for VITE.
VITE_RECAPTCHA_SITE_KEY=    #Fill in site key from recaptcha.
```
Fill in all variables with your desired value.

## Continue development
Start Your database docker then run the following command

```bash
cd database
docker compose -f db-compose-dev.yml --env-file "../backend/.env" up -d
cd ../backend
npm run dev
cd ../frontend
npm run dev
```
