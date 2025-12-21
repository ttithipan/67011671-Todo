SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";


CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` varchar(50) DEFAULT NULL,    -- Nullable if Google user hasn't set one
  `email` varchar(100) NOT NULL UNIQUE,   -- CRITICAL for linking Google to Local accounts
  `full_name` varchar(100) NOT NULL,      -- Synced from Google or provided by user
  `profile_image` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL, -- Null for Google-only users
  `salt` varchar(64) DEFAULT NULL,           -- Null for Google-only users
  `google_id` varchar(255) DEFAULT NULL,     -- The unique ID from Google
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure username and google_id are unique if they exist
  UNIQUE KEY `unique_username` (`username`),
  UNIQUE KEY `unique_google` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `todo` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,                 -- CHANGED: References users.id
  `task` varchar(50) NOT NULL,
  `done` tinyint(1) NOT NULL DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `target_date` datetime DEFAULT NULL,
  
  -- Foreign Key Constraint
  CONSTRAINT `fk_todo_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE                     -- If user is deleted, delete their tasks
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
