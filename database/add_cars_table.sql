-- SUTANA EMS - Fleet Gallery Update
-- Run this script in your MySQL database to create the cars table

CREATE TABLE IF NOT EXISTS `cars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `seats` int(11) NOT NULL DEFAULT 4,
  `transmission` enum('Manual','Automatic') NOT NULL DEFAULT 'Manual',
  `fuel_type` enum('Petrol','Diesel','Hybrid') NOT NULL DEFAULT 'Petrol',
  `car_type` enum('4x4','Sedan','Hatchback','Cargo','SUV') NOT NULL DEFAULT 'Sedan',
  `description` text,
  `availability` enum('Available','Booked','Maintenance') NOT NULL DEFAULT 'Available',
  `image1` varchar(255) DEFAULT NULL,
  `image2` varchar(255) DEFAULT NULL,
  `image3` varchar(255) DEFAULT NULL,
  `image4` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
