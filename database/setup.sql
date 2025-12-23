SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

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
  UNIQUE KEY `unique_google` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE `todo` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `task` varchar(50) NOT NULL,
  `done` tinyint(1) NOT NULL DEFAULT '0',
  `target_date` datetime DEFAULT NULL,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `team_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  -- team_id and user_id is nullable to support personal todo and unassigned team_todo.BIGINT
  -- Must do periodic cleanup.

  -- FK 1: USER EXISTENCE (For Personal Tasks)
  CONSTRAINT `fk_todo_user_exists`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE SET NULL, -- If User deleted: Team task becomes unassigned. (Personal task requires cleanup query).

  -- FK 2: TEAM EXISTENCE (For Team Tasks)
  CONSTRAINT `fk_todo_team_exists`
    FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) 
    ON DELETE CASCADE, -- If Team deleted: Delete all their tasks.

  -- FK 3: MEMBERSHIP INTEGRITY (The Anti-Redundancy Check)
  -- If BOTH team and user are set, this ensures the user is actually IN that team.
  CONSTRAINT `fk_todo_verified_member` 
    FOREIGN KEY (`team_id`, `user_id`) 
    REFERENCES `team_members` (`team_id`, `user_id`)
    ON DELETE SET NULL -- If member leaves team, keep task but unassign user.
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;