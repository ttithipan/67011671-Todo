
## Setup
```bash
git clone https://github.com/ttithipan/67011671-Todo.git
cd frontend
npm install
cd ../backend
npm install
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

In  ```frontend-vite```, make a ```.env``` file with the following variables.
```
VITE_API_HOST=          #Fill in hostname from API_HOST.
VITE_API_PORT=          #Fill in port number from API_PORT.
```
Fill in all variables with your desired value.

Then copy code from ```/setup/init.sql``` then run it in database manager.
http://localhost:{PMA_HOST_PORT}/index.php?route=/table/sql&db={MYSQL_DATABASE}&table=todo

