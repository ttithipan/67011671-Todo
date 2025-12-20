
## Setup
```bash
git clone https://github.com/ttithipan/67011671-Todo.git
cd frontend
npm install
cd ../backend
npm install
docker compose -f db-compose-dev.yml --env-file "../backend/.env" up -d
npm run setup
```

In ```/backend```, make a ```.env``` file with the following varables.
```
MYSQL_ROOT_PASSWORD=    #Fill in root password
MYSQL_DATABASE=         #Fill in database name.
MYSQL_USER=             #Fill in Username for database
MYSQL_PASSWORD=         #Fill in password for database
PMA_HOST_PORT=          #Fill in port number for phpmyadmin.
API_HOST=               #Fill in hostname
API_PORT=               #Fill in port number for api server.
DB_HOST=                #Fill in Database host.
DB_PORT=                #Fill in port number for database host.
```

In  ```/frontend```, make a ```.env``` file with the following variables.
```
VITE_API_HOST=          #Fill in hostname from API_HOST.
VITE_API_PORT=          #Fill in port number from API_PORT.
```
Fill in all variables with your desired value.

## Continue development
Start Your database docker then run the following command

```bash
cd ./backend
npm run start
cd ../frontend
npm run dev
```
