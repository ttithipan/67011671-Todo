SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- 1. TEAMS (No changes)
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS (No changes)
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `salt` varchar(64) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_username` (`username`),
  UNIQUE KEY `unique_email` (`email`),
  UNIQUE KEY `unique_google` (`google_id`),
  `is_assignee` tinyint(1) NOT NULL DEFAULT '0',
  `expertise` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `team_members` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `team_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('leader','member') NOT NULL DEFAULT 'member',
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_members_team`
    FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    
  UNIQUE KEY `unique_membership` (`team_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TODO (Updated)
CREATE TABLE `todo` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `owner` int DEFAULT NULL,                 -- CHANGED: Now Nullable (Task can be unassigned)
  `team_id` int DEFAULT NULL,                 -- NEW: Direct link to Team
  `task` varchar(50) NOT NULL,
  `done` tinyint(1) NOT NULL DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `target_date` datetime DEFAULT NULL,
  `assignee` int DEFAULT NULL,
  
  CONSTRAINT `fk_todo_user` 
    FOREIGN KEY (`owner`) REFERENCES `users` (`id`) 
    ON DELETE SET NULL,                       

  CONSTRAINT `fk_todo_team`
    FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
    ON DELETE CASCADE                       -- If Team deleted, delete their tasks
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO teams (name) VALUES ('Personal');

COMMIT;