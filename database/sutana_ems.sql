-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 07, 2026 at 11:40 PM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sutana_ems`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `resource_id` varchar(255) DEFAULT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text,
  `status` varchar(20) DEFAULT 'success',
  `error_message` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `resource`, `resource_id`, `before_state`, `after_state`, `ip_address`, `user_agent`, `status`, `error_message`, `created_at`) VALUES
(1, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:07:24'),
(2, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:07:39'),
(3, 18, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:08:00'),
(4, 22, 'USER_DELETED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:08:50'),
(5, 21, 'USER_DELETED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:08:54'),
(6, 23, 'USER_DELETED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:08:56'),
(7, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:12:00'),
(8, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:28:50'),
(9, 18, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:29:56'),
(10, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:30:05'),
(11, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:37:22'),
(12, 18, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:38:46'),
(13, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:39:44'),
(14, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-26 23:44:34'),
(15, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-26 23:44:38'),
(16, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:44:48'),
(17, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-26 23:45:10'),
(18, 18, 'SESSION_EVICTED', 'SESSION', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:52:33'),
(19, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:52:33'),
(20, 18, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:53:12'),
(21, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:53:39'),
(22, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:54:03'),
(23, 22, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:54:34'),
(25, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:57:40'),
(26, 23, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-26 23:58:02'),
(27, 23, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-26 23:58:27'),
(30, 23, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:11:49'),
(31, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:12:30'),
(33, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:14:16'),
(34, 19, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 00:14:22'),
(35, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:14:33'),
(36, 19, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:02'),
(37, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:03'),
(38, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:03'),
(39, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:40'),
(40, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:40'),
(41, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:47'),
(42, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:15:47'),
(43, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:16:37'),
(44, 23, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 00:17:08'),
(45, 23, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:17:26'),
(49, 23, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:21:08'),
(50, 22, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 00:21:17'),
(51, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:21:30'),
(52, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:22:10'),
(53, 21, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 00:22:22'),
(54, 21, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:25:26'),
(55, 21, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:25:56'),
(56, 21, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:26:25'),
(57, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 00:26:53'),
(58, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:27:04'),
(59, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:27:15'),
(60, 27, 'USER_REGISTERED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:34:38'),
(61, 27, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:34:45'),
(64, 27, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:36:51'),
(65, 21, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:37:09'),
(66, 21, 'PRINTING_ORDER_STATUS_UPDATED', 'PRINTING', '1', NULL, '{\"status_code\": \"in_progress\", \"completed_at\": null}', '::1', NULL, 'success', NULL, '2026-05-27 00:37:31'),
(67, 21, 'PRINTING_ORDER_STATUS_UPDATED', 'PRINTING', '1', NULL, '{\"status_code\": \"quality_check\", \"completed_at\": null}', '::1', NULL, 'success', NULL, '2026-05-27 00:37:33'),
(68, 21, 'PRINTING_ORDER_STATUS_UPDATED', 'PRINTING', '1', NULL, '{\"status_code\": \"ready\", \"completed_at\": null}', '::1', NULL, 'success', NULL, '2026-05-27 00:37:35'),
(69, 21, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 00:37:59'),
(70, 27, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 00:38:10'),
(71, 22, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 09:23:39'),
(72, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 09:23:49'),
(74, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:24:48'),
(75, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:24:53'),
(76, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:25:30'),
(77, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:26:22'),
(78, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:26:29'),
(79, 23, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 09:26:39'),
(80, 23, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:26:49'),
(81, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 09:26:58'),
(82, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:27:05'),
(83, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:27:39'),
(84, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 09:32:48'),
(85, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 19:53:02'),
(87, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 19:54:22'),
(88, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:09:22'),
(89, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 20:09:39'),
(90, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:09:59'),
(91, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:36:33'),
(92, 20, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 20:36:40'),
(93, 20, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 20:36:56'),
(94, 20, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:37:35'),
(96, 20, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:39:36'),
(97, 24, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 20:39:51'),
(98, 24, 'PASSWORD_CHANGED', 'PASSWORD', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:40:22'),
(99, 24, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:41:46'),
(100, 24, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 20:41:51'),
(101, 24, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 20:42:00'),
(102, 22, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-27 23:50:27'),
(103, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-27 23:50:40'),
(105, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 23:52:49'),
(106, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-27 23:53:04'),
(107, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:20:56'),
(108, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:28:51'),
(109, 20, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-28 00:29:40'),
(110, 20, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-28 00:29:42'),
(111, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:29:58'),
(112, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:30:42'),
(113, 20, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-28 00:30:56'),
(114, 20, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:31:30'),
(115, 20, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:33:30'),
(116, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:33:50'),
(118, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:36:35'),
(119, 19, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-05-28 00:37:57'),
(120, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:38:04'),
(121, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:05'),
(122, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:05'),
(123, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:12'),
(124, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:13'),
(125, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:16'),
(126, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:38:16'),
(127, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:31'),
(128, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:31'),
(129, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:33'),
(130, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:33'),
(131, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:34'),
(132, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:41:34'),
(133, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:43:04'),
(134, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:04'),
(135, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:04'),
(136, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:11'),
(137, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:11'),
(138, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:14'),
(139, 19, 'CEO_MONTHLY_REPORT_GENERATED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:43:14'),
(140, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:55:06'),
(141, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:55:24'),
(142, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:55:24'),
(143, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:55:41'),
(145, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:56:19'),
(146, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:56:25'),
(147, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 00:56:29'),
(148, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:56:29'),
(149, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 00:56:29'),
(150, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 04:14:13'),
(152, 22, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:20:30'),
(153, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:20:45'),
(154, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 04:20:52'),
(155, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:20:53'),
(156, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:20:53'),
(157, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:25:56'),
(158, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:25:57'),
(159, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:05'),
(160, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:05'),
(162, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:20'),
(163, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:20'),
(164, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:45'),
(165, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:30:45'),
(166, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:47:26'),
(167, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 04:47:29'),
(168, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:47:29'),
(169, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 04:47:29'),
(170, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:01:30'),
(171, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:02:20'),
(172, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:02:21'),
(173, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:02:21'),
(175, 19, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'UNAUTHORIZED', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:02:52'),
(176, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:02:57'),
(177, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:02:57'),
(178, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:03:06'),
(180, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:03:52'),
(181, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:03:56'),
(182, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:04:02'),
(183, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:04:07'),
(184, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:04:07'),
(185, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:04:07'),
(188, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:04:30'),
(189, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:04:30'),
(190, 23, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:04:37'),
(191, 23, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:10:02'),
(192, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:10:09'),
(193, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:10:09'),
(194, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:10:09'),
(195, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:10:21'),
(196, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:10:21'),
(197, 22, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:10:30'),
(199, 22, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:11:14'),
(200, 19, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:11:20'),
(201, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:11:21'),
(202, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:11:21'),
(204, 19, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:11:45'),
(205, 19, 'CEO_DASHBOARD_VIEWED', 'CEO', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:11:45'),
(206, 23, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:11:53'),
(207, 23, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-05-28 05:12:11'),
(208, 20, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:12:39'),
(209, 20, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-05-28 05:19:41'),
(210, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-06-04 09:56:57'),
(211, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-06-04 09:57:04'),
(212, 18, 'LOGIN_FAILED', 'LOGIN', NULL, NULL, NULL, '::1', NULL, 'success', 'Invalid password', '2026-06-04 09:57:36'),
(213, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-04 10:00:27'),
(214, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-04 10:01:30'),
(215, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-07 14:47:22'),
(216, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-07 23:12:51'),
(217, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-07 23:29:43'),
(218, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-07 23:29:53'),
(219, 28, 'USER_CREATED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:08:10'),
(220, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:08:19'),
(221, 28, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:08:26'),
(222, 28, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:08:47'),
(223, 18, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:08:53'),
(225, 29, 'USER_CREATED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:11:12'),
(226, 18, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:11:20'),
(227, 29, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:11:27'),
(228, 29, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:11:36'),
(229, 30, 'USER_REGISTERED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:14:12'),
(230, 30, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:14:13'),
(231, 30, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:15:28'),
(232, 30, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:15:35'),
(233, 30, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:15:39'),
(234, 31, 'USER_REGISTERED', 'USER', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:19:37'),
(235, 31, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:19:44'),
(236, 31, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:32:07'),
(237, 28, 'LOGIN_SUCCESS', 'LOGIN', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL, '2026-06-08 00:32:15'),
(238, 28, 'LOGOUT', 'LOGOUT', NULL, NULL, NULL, '::1', NULL, 'success', NULL, '2026-06-08 00:32:33');

-- --------------------------------------------------------

--
-- Table structure for table `communication_logs`
--

CREATE TABLE `communication_logs` (
  `id` bigint(20) NOT NULL,
  `type` varchar(10) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `content` text NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `provider_response` text,
  `retry_count` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `customer_type_id` int(11) NOT NULL,
  `address` text,
  `tax_id` varchar(50) DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `user_id`, `name`, `phone`, `email`, `customer_type_id`, `address`, `tax_id`, `credit_limit`, `current_balance`, `created_at`, `updated_at`, `created_by`, `deleted_at`) VALUES
(1, NULL, 'Tigray Water Works', '0922222222', 'procurement@tigraywaterworks.com', 1, 'Mekelle, Tigray', NULL, '100000.00', '0.00', '2026-05-26 23:05:10', '2026-05-26 23:05:10', NULL, NULL),
(2, 27, 'fekadu', '0923456788', 'pfekade@sutana.com', 5, NULL, NULL, '0.00', '0.00', '2026-05-27 00:34:38', '2026-05-27 00:34:38', 27, NULL),
(3, 30, 'yonas mezgebu', '0901407034', 'yonasmezgebu18@gmail.com', 5, NULL, NULL, '0.00', '0.00', '2026-06-08 00:14:11', '2026-06-08 00:14:11', 30, NULL),
(4, 31, 'yonas mezgebu', '0901407036', 'yonasmezgebu20@gmail.com', 5, NULL, NULL, '0.00', '0.00', '2026-06-08 00:19:37', '2026-06-08 00:19:37', 31, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_notifications`
--

CREATE TABLE `customer_notifications` (
  `id` bigint(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `link_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `customer_notifications`
--

INSERT INTO `customer_notifications` (`id`, `customer_id`, `title`, `message`, `type`, `is_read`, `link_url`, `created_at`) VALUES
(1, 2, 'Order Status Update', 'Your order PRT-20260526-0001 is now Ready.', 'order_update', 0, '/customer/orders/23/track', '2026-05-26 04:48:41'),
(2, 2, 'Order Status Update', 'Your order PRT-20260526-0001 is now Delivered.', 'order_update', 0, '/customer/orders/23/track', '2026-05-26 04:49:02'),
(3, 2, 'Order Status Update', 'Your order PRT-20260526-0001 is now Delivered.', 'order_update', 0, '/customer/orders/23/track', '2026-05-26 04:49:05'),
(4, 2, 'Order Status Update', 'Your order PRT-20260527-0001 is now In Progress.', 'order_update', 0, '/customer/orders/1/track', '2026-05-27 00:37:31'),
(5, 2, 'Order Status Update', 'Your order PRT-20260527-0001 is now Quality Check.', 'order_update', 0, '/customer/orders/1/track', '2026-05-27 00:37:33'),
(6, 2, 'Order Status Update', 'Your order PRT-20260527-0001 is now Ready.', 'order_update', 0, '/customer/orders/1/track', '2026-05-27 00:37:35');

-- --------------------------------------------------------

--
-- Table structure for table `customer_quotes`
--

CREATE TABLE `customer_quotes` (
  `id` varchar(255) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_type` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `paper_type` varchar(50) NOT NULL,
  `pages_per_copy` int(11) NOT NULL,
  `color_printing` tinyint(1) NOT NULL DEFAULT '0',
  `binding_type` varchar(50) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `breakdown_json` text,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `customer_quotes`
--

INSERT INTO `customer_quotes` (`id`, `customer_id`, `product_type`, `quantity`, `paper_type`, `pages_per_copy`, `color_printing`, `binding_type`, `total_price`, `breakdown_json`, `status`, `created_at`, `expires_at`) VALUES
('1779048412621', 4, 'Brochure', 132, 'A4', 1, 0, 'Thermal', '39666.00', '{\"pricePerUnit\":0.5,\"bindingCost\":39600,\"subtotal\":66,\"totalPrice\":39666}', 'pending', '2026-05-17 20:06:52', '2026-05-24 23:06:53'),
('1779798957732', 5, 'Exam', 2, 'A4', 1, 0, 'None', '1.00', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":1,\"totalPrice\":1}', 'pending', '2026-05-26 12:35:57', '2026-06-02 15:35:58'),
('1779798997335', 5, 'Exam', 2, 'A4', 1, 0, 'None', '1.00', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":1,\"totalPrice\":1}', 'pending', '2026-05-26 12:36:37', '2026-06-02 15:36:37'),
('1779799006805', 5, 'Exam', 3, 'A4', 1, 0, 'None', '1.50', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":1.5,\"totalPrice\":1.5}', 'pending', '2026-05-26 12:36:46', '2026-06-02 15:36:47'),
('1779799013533', 5, 'Exam', 3, 'A4', 1, 0, 'None', '1.50', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":1.5,\"totalPrice\":1.5}', 'pending', '2026-05-26 12:36:53', '2026-06-02 15:36:54'),
('1779799026247', 5, 'Exam', 29, 'A4', 1, 0, 'None', '14.50', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":14.5,\"totalPrice\":14.5}', 'pending', '2026-05-26 12:37:06', '2026-06-02 15:37:06'),
('1779799221212', 5, 'Exam', 2, 'A4', 3, 0, 'None', '3.00', '{\"pricePerUnit\":1.5,\"bindingCost\":0,\"subtotal\":3,\"totalPrice\":3}', 'pending', '2026-05-26 12:40:21', '2026-06-02 15:40:21'),
('1779799291085', 5, 'Module', 4, 'A4', 2, 0, 'None', '4.00', '{\"pricePerUnit\":1,\"bindingCost\":0,\"subtotal\":4,\"totalPrice\":4}', 'pending', '2026-05-26 12:41:31', '2026-06-02 15:41:31'),
('1779874592373', 2, 'Exam', 15, 'A4', 1, 0, 'None', '7.50', '{\"pricePerUnit\":0.5,\"bindingCost\":0,\"subtotal\":7.5,\"totalPrice\":7.5}', 'pending', '2026-05-27 09:36:32', '2026-06-03 12:36:32');

-- --------------------------------------------------------

--
-- Table structure for table `customer_types`
--

CREATE TABLE `customer_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color_code` varchar(7) NOT NULL DEFAULT '#6B7280',
  `icon_name` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `customer_types`
--

INSERT INTO `customer_types` (`id`, `name`, `color_code`, `icon_name`, `sort_order`) VALUES
(1, 'Government', '#EF4444', 'building', 1),
(2, 'Scholar', '#3B82F6', 'graduation-cap', 2),
(3, 'Lecturer', '#10B981', 'chalkboard-user', 3),
(4, 'Church', '#8B5CF6', 'church', 4),
(5, 'Regular', '#6B7280', 'user', 5);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'System administration'),
(2, 'CEO', 'Executive management'),
(3, 'Finance', 'Financial operations'),
(4, 'Printing', 'Printing production'),
(5, 'Purchase', 'Procurement'),
(6, 'Sales', 'Sales and POS'),
(7, 'Inventory', 'Stock management'),
(8, 'Customer', 'Customer self-service portal'),
(9, 'Farming', 'Agricultural operations'),
(10, 'Pharmacy', 'Pharmacy and medical supplies'),
(11, 'Car Renting', 'Vehicle rental services');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `department` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `join_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `receipt_path` varchar(255) DEFAULT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `entered_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `requires_approval` tinyint(1) DEFAULT '0',
  `approval_limit` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `unit_cost` decimal(15,2) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_counted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`product_id`, `quantity`, `unit_cost`, `location`, `last_updated`, `last_counted`) VALUES
(1, 500, '0.00', NULL, '2026-05-27 00:00:17', NULL),
(2, 444, '0.00', NULL, '2026-05-27 00:20:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` bigint(20) NOT NULL,
  `product_id` int(11) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reason` text,
  `performed_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `product_id`, `transaction_type`, `quantity_change`, `quantity_before`, `quantity_after`, `reference_type`, `reference_id`, `reason`, `performed_by`, `approved_by`, `created_at`) VALUES
(1, 1, 'Adjustment', 500, 0, 500, 'Adjustment', NULL, 'adding', 23, NULL, '2026-05-27 00:00:17'),
(2, 2, 'Adjustment', 498, 0, 498, 'Adjustment', NULL, 'DDYY GFU', 23, NULL, '2026-05-27 00:19:42'),
(3, 2, 'Damaged', -54, 498, 444, NULL, NULL, 'YFRFY GIF', 23, NULL, '2026-05-27 00:20:48');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_payments`
--

CREATE TABLE `invoice_payments` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `processed_by` int(11) NOT NULL,
  `processed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `order_statuses`
--

CREATE TABLE `order_statuses` (
  `id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `order_statuses`
--

INSERT INTO `order_statuses` (`id`, `status_code`, `status_name`, `color_hex`, `sort_order`) VALUES
(1, 'received', 'Received', '#9CA3AF', 1),
(2, 'in_progress', 'In Progress', '#3B82F6', 2),
(3, 'quality_check', 'Quality Check', '#F59E0B', 3),
(4, 'ready', 'Ready', '#10B981', 4),
(5, 'delivered', 'Delivered', '#059669', 5);

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `from_status` varchar(50) DEFAULT NULL,
  `to_status` varchar(50) NOT NULL,
  `note` text,
  `changed_by` int(11) NOT NULL,
  `changed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `from_status`, `to_status`, `note`, `changed_by`, `changed_at`, `ip_address`) VALUES
(1, 1, NULL, 'received', NULL, 27, '2026-05-27 00:36:38', '::1');

-- --------------------------------------------------------

--
-- Table structure for table `password_history`
--

CREATE TABLE `password_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `password_history`
--

INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES
(4, 23, '$2b$10$nPTGmRcaRzR098UYpxejwOZsHtoEFffYhV8wk0Ogyr3VQvP7xiS02', '2026-05-26 11:42:31'),
(5, 18, '$2b$10$nPTGmRcaRzR098UYpxejwOZsHtoEFffYhV8wk0Ogyr3VQvP7xiS02', '2026-05-26 11:44:39'),
(6, 20, '$2b$10$nPTGmRcaRzR098UYpxejwOZsHtoEFffYhV8wk0Ogyr3VQvP7xiS02', '2026-05-26 11:57:39'),
(7, 22, '$2b$10$nPTGmRcaRzR098UYpxejwOZsHtoEFffYhV8wk0Ogyr3VQvP7xiS02', '2026-05-26 12:07:34'),
(8, 19, '$2b$10$fER.UKc1SRMj./GLR8vF1Obbh7x0DkEbjzUnjmBfvEfNp9Qr7HMli', '2026-05-26 22:18:10'),
(9, 22, '$2b$10$fER.UKc1SRMj./GLR8vF1Obbh7x0DkEbjzUnjmBfvEfNp9Qr7HMli', '2026-05-26 22:50:37'),
(10, 18, '$2b$10$fER.UKc1SRMj./GLR8vF1Obbh7x0DkEbjzUnjmBfvEfNp9Qr7HMli', '2026-05-26 23:08:00'),
(11, 18, '$2b$10$dWb8JexmlmKdmKKDh9lKCOaQjYGh4harC7JMVHJdmb9vBFVsTtO0W', '2026-05-26 23:29:56'),
(12, 18, '$2b$10$lnWtGLIf2ceprOKtOP11Huq9Xmo9xkkQfu1B5Ps29a5P/7T2OBQIG', '2026-05-26 23:38:46'),
(13, 18, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-26 23:53:12'),
(14, 22, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-26 23:54:34'),
(15, 23, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-26 23:58:27'),
(16, 19, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-27 00:15:02'),
(17, 21, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-27 00:25:56'),
(18, 20, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-27 20:37:35'),
(19, 24, '$2b$10$4nEya5dRTIHQXUt.neUZIe6zgPONq9VSqi1p3k7iSjpZWLn7z2ZBy', '2026-05-27 20:40:22');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `requires_reference` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `requires_reference`, `is_active`) VALUES
(1, 'Cash', 0, 1),
(2, 'Credit', 0, 1),
(3, 'Bank Transfer', 1, 1),
(4, 'Telebirr', 1, 1),
(5, 'Check', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `payment_statuses`
--

CREATE TABLE `payment_statuses` (
  `id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `payment_statuses`
--

INSERT INTO `payment_statuses` (`id`, `status_code`, `status_name`, `color_hex`, `sort_order`) VALUES
(1, 'pending', 'Pending', '#F59E0B', 1),
(2, 'completed', 'Completed', '#10B981', 2),
(3, 'failed', 'Failed', '#EF4444', 3),
(4, 'refunded', 'Refunded', '#6B7280', 4);

-- --------------------------------------------------------

--
-- Table structure for table `payment_terms`
--

CREATE TABLE `payment_terms` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `days_net` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `payment_terms`
--

INSERT INTO `payment_terms` (`id`, `name`, `days_net`) VALUES
(1, 'Net 30', 30),
(2, 'Net 60', 60),
(3, 'COD', 0),
(4, 'Prepaid', 0);

-- --------------------------------------------------------

--
-- Table structure for table `pos_items`
--

CREATE TABLE `pos_items` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `pos_sales`
--

CREATE TABLE `pos_sales` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(20) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `amount_paid` decimal(15,2) NOT NULL,
  `change_amount` decimal(15,2) DEFAULT '0.00',
  `cashier_id` int(11) NOT NULL,
  `sale_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status_id` int(11) NOT NULL,
  `voided_by` int(11) DEFAULT NULL,
  `void_reason` text,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `po_items`
--

CREATE TABLE `po_items` (
  `id` int(11) NOT NULL,
  `po_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `quantity_received` int(11) DEFAULT '0',
  `quantity_damaged` int(11) DEFAULT '0',
  `quality_pass` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `po_items`
--

INSERT INTO `po_items` (`id`, `po_id`, `product_id`, `product_name`, `quantity_ordered`, `unit_price`, `total`, `quantity_received`, `quantity_damaged`, `quality_pass`) VALUES
(1, 1, NULL, 'A4 printing paper', 199, '150.00', '29850.00', 0, 0, NULL),
(2, 2, NULL, 'paper', 100, '2.00', '200.00', 0, 0, NULL),
(3, 3, NULL, 'nnnnn', 1, '5.00', '5.00', 0, 0, NULL),
(4, 4, NULL, 'wdasf', 31, '4.00', '124.00', 0, 0, NULL),
(5, 5, NULL, 's', 1, '1.99', '1.99', 0, 0, NULL),
(6, 6, NULL, 'jvhcdg', 18, '490.00', '8820.00', 0, 0, NULL),
(7, 7, NULL, 'ccc', 1, '45.00', '45.00', 1, 0, 1),
(8, 8, NULL, 'paper', 1000, '1.99', '1990.00', 1000, 0, 1),
(9, 9, NULL, 'yhhhhh', 100, '33.00', '3300.00', 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `po_payments`
--

CREATE TABLE `po_payments` (
  `id` int(11) NOT NULL,
  `po_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `processed_by` int(11) NOT NULL,
  `processed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `po_payments`
--

INSERT INTO `po_payments` (`id`, `po_id`, `amount`, `payment_method_id`, `reference_number`, `status_id`, `processed_by`, `processed_at`, `notes`) VALUES
(1, 1, '100.00', 2, '#1', 2, 20, '2026-05-27 20:38:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `po_statuses`
--

CREATE TABLE `po_statuses` (
  `id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `po_statuses`
--

INSERT INTO `po_statuses` (`id`, `status_code`, `status_name`, `color_hex`, `sort_order`) VALUES
(1, 'draft', 'Draft', '#6B7280', 1),
(2, 'pending', 'Pending Approval', '#F59E0B', 2),
(3, 'approved', 'Approved', '#10B981', 3),
(4, 'rejected', 'Rejected', '#EF4444', 4),
(5, 'sent', 'Sent to Supplier', '#3B82F6', 5),
(6, 'partial_received', 'Partial Received', '#8B5CF6', 6),
(7, 'complete', 'Complete', '#059669', 7),
(8, 'cancelled', 'Cancelled', '#EF4444', 8);

-- --------------------------------------------------------

--
-- Table structure for table `printing_orders`
--

CREATE TABLE `printing_orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_type_id` int(11) NOT NULL,
  `product_type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `paper_type` varchar(10) NOT NULL,
  `pages_per_copy` int(11) NOT NULL,
  `color_printing` tinyint(1) DEFAULT '0',
  `binding_type` varchar(20) DEFAULT 'None',
  `due_date` date NOT NULL,
  `special_instructions` text,
  `attachments` json DEFAULT NULL,
  `price_per_unit` decimal(15,2) NOT NULL,
  `binding_cost` decimal(15,2) DEFAULT '0.00',
  `total_price` decimal(15,2) NOT NULL,
  `status_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `printing_orders`
--

INSERT INTO `printing_orders` (`id`, `order_number`, `customer_id`, `customer_type_id`, `product_type`, `quantity`, `paper_type`, `pages_per_copy`, `color_printing`, `binding_type`, `due_date`, `special_instructions`, `attachments`, `price_per_unit`, `binding_cost`, `total_price`, `status_id`, `created_by`, `created_at`, `updated_at`, `completed_at`, `deleted_at`) VALUES
(1, 'PRT-20260527-0001', 2, 5, 'Exam', 15, 'A4', 1, 0, 'None', '2026-06-03', NULL, '[{\"id\": \"1779874598990p2nx4a0ui\", \"path\": \"uploads\\\\orders\\\\27_1779874598962-83c51eec.pdf\", \"size\": 810815, \"filename\": \"27_1779874598962-83c51eec.pdf\", \"mimeType\": \"application/pdf\", \"uploadedAt\": \"2026-05-27T09:36:38.990Z\", \"uploadedBy\": 27, \"originalName\": \"pressentaton.pdf\"}]', '0.50', '0.00', '7.50', 4, 27, '2026-05-27 00:36:38', '2026-05-27 00:37:35', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `category_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `reorder_level` int(11) DEFAULT '0',
  `expiry_date` date DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `sku`, `category_id`, `unit_id`, `selling_price`, `reorder_level`, `expiry_date`, `supplier_id`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'A4 printing paper', 'PAP-A4-03', 1, 2, '200.00', 20, NULL, NULL, 1, '2026-05-26 23:59:54', '2026-05-26 23:59:54', NULL),
(2, 'PAPER', 'PAP-A4-07', 1, 1, '500.00', 30, NULL, NULL, 1, '2026-05-27 00:19:21', '2026-05-27 00:19:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`id`, `name`, `is_active`) VALUES
(1, 'General', 1);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL,
  `po_number` varchar(20) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery_date` date NOT NULL,
  `sector_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `notes` text,
  `attachment` varchar(255) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `po_number`, `supplier_id`, `order_date`, `expected_delivery_date`, `sector_id`, `status_id`, `subtotal`, `tax_amount`, `total_amount`, `paid_amount`, `notes`, `attachment`, `approved_by`, `approved_at`, `rejection_reason`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'PO-20260527-0001', 1, '2026-05-26', '2026-05-30', 4, 1, '29850.00', '4477.50', '34327.50', '0.00', NULL, NULL, NULL, NULL, NULL, 22, '2026-05-26 23:56:09', '2026-05-27 20:38:43', NULL),
(2, 'PO-20260527-0002', 1, '2026-05-27', '2026-05-30', 4, 1, '200.00', '30.00', '230.00', '0.00', NULL, NULL, NULL, NULL, NULL, 22, '2026-05-27 09:24:39', '2026-05-27 09:24:39', NULL),
(3, 'PO-20260528-0001', 1, '2026-05-27', '2026-05-30', 4, 1, '5.00', '0.75', '5.75', '0.00', NULL, NULL, NULL, NULL, NULL, 22, '2026-05-27 19:54:18', '2026-05-27 19:54:18', NULL),
(4, 'PO-20260528-0002', 1, '2026-05-27', '2026-05-31', 3, 1, '124.00', '18.60', '142.60', '0.00', NULL, NULL, NULL, NULL, NULL, 22, '2026-05-27 23:52:41', '2026-05-27 23:52:41', NULL),
(5, 'PO-20260528-0003', 1, '2026-05-28', '2026-06-05', 2, 1, '1.99', '0.30', '2.29', '0.00', 'afv aefdc', NULL, NULL, NULL, NULL, 22, '2026-05-28 00:34:57', '2026-05-28 00:34:57', NULL),
(6, 'PO-20260528-0004', 1, '2026-05-28', '2026-07-09', 3, 1, '8820.00', '1323.00', '10143.00', '0.00', 'jghfgdfsdgf', NULL, NULL, NULL, NULL, 22, '2026-05-28 00:56:15', '2026-05-28 00:56:15', NULL),
(7, 'PO-20260528-0005', 1, '2026-05-28', '2026-07-18', 3, 7, '45.00', '6.75', '51.75', '0.00', 'df dfgh', NULL, 19, '2026-05-28 04:30:12', NULL, 22, '2026-05-28 04:14:58', '2026-05-28 05:02:32', NULL),
(8, 'PO-20260528-0006', 1, '2026-05-28', '2026-05-30', 1, 7, '1990.00', '298.50', '2288.50', '0.00', 'eeee ddfg', NULL, 19, '2026-05-28 05:04:17', NULL, 22, '2026-05-28 05:03:43', '2026-05-28 05:04:26', NULL),
(9, 'PO-20260528-0007', 1, '2026-05-28', '2026-05-31', 3, 3, '3300.00', '495.00', '3795.00', '0.00', 'bn juytrew', NULL, 19, '2026-05-28 05:11:34', NULL, 22, '2026-05-28 05:11:04', '2026-05-28 05:11:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `permissions` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `created_at`) VALUES
(1, 'Admin', 'Full system access', '{\"all\": [\"*\"]}', '2026-05-13 14:51:12'),
(2, 'CEO', 'Strategic oversight', '{\"ceo\": [\"dashboard\", \"revenue\", \"profit\", \"cashflow\", \"kpis\", \"targets\", \"update_targets\", \"alerts\", \"reports\"], \"reports\": [\"read\", \"export\"], \"dashboard\": [\"read\"], \"receiving\": [\"read\", \"create\"], \"suppliers\": [\"read\"], \"purchase_orders\": [\"approve\", \"read\"]}', '2026-05-13 14:51:12'),
(3, 'Finance', 'Financial operations', '{\"reports\": [\"read\"], \"expenses\": [\"create\", \"read\", \"update\", \"approve\"], \"payments\": [\"create\", \"read\"], \"tax_receipts\": [\"read\"]}', '2026-05-13 14:51:12'),
(4, 'Printing Supervisor', 'Printing order management', '{\"orders\": [\"create\", \"read\", \"update\"], \"reports\": [\"read\"], \"tax_receipts\": [\"read\", \"create\"]}', '2026-05-13 14:51:12'),
(5, 'Purchase', 'Procurement management', '{\"reports\": [\"read\"], \"inventory\": [\"read\"], \"receiving\": [\"create\", \"read\"], \"suppliers\": [\"create\", \"read\", \"update\"], \"purchase_orders\": [\"create\", \"read\", \"update\"]}', '2026-05-13 14:51:12'),
(6, 'Store Worker', 'Inventory management', '{\"reports\": [\"read\"], \"inventory\": [\"create\", \"read\", \"update\"], \"receiving\": [\"create\", \"read\"]}', '2026-05-13 14:51:12'),
(7, 'Sales/Cashier', 'POS operations', '{\"pos\": [\"create\", \"read\"], \"reports\": [\"read\"], \"customers\": [\"create\", \"read\"]}', '2026-05-13 14:51:12'),
(8, 'Customer', 'Self-service portal', '{\"orders\": [\"create\", \"read\"], \"balance\": [\"read\"], \"profile\": [\"read\", \"update\"]}', '2026-05-13 14:51:12'),
(9, 'Farming Manager', 'Manage farming operations', '{\"farming\": [\"create\", \"read\", \"update\"]}', '2026-06-07 23:39:56'),
(10, 'Pharmacist', 'Manage pharmacy operations', '{\"pharmacy\": [\"create\", \"read\", \"update\"]}', '2026-06-07 23:39:56'),
(11, 'Car Renting Manager', 'Manage vehicle rentals', '{\"car_renting\": [\"create\", \"read\", \"update\"]}', '2026-06-07 23:39:56');

-- --------------------------------------------------------

--
-- Table structure for table `sale_statuses`
--

CREATE TABLE `sale_statuses` (
  `id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `sale_statuses`
--

INSERT INTO `sale_statuses` (`id`, `status_code`, `status_name`, `color_hex`, `sort_order`) VALUES
(1, 'completed', 'Completed', '#10B981', 1),
(2, 'voided', 'Voided', '#EF4444', 2),
(3, 'refunded', 'Refunded', '#F59E0B', 3);

-- --------------------------------------------------------

--
-- Table structure for table `sectors`
--

CREATE TABLE `sectors` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `sectors`
--

INSERT INTO `sectors` (`id`, `name`, `description`) VALUES
(1, 'Printing', NULL),
(2, 'Sales', NULL),
(3, 'Pharmacy', NULL),
(4, 'General Office', NULL),
(5, 'Farming', 'Agricultural Sector'),
(7, 'Car Renting', 'Transportation Sector');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `token`, `expires_at`, `ip_address`, `user_agent`, `created_at`) VALUES
('12b3d60c-3f95-485a-8074-15c942dc9fc2', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJ0b2tlbklkIjoiYWI0NzFmMDgtMjljOS00ZjhlLTk0MzEtYzc3NzI3N2I0YTY2IiwiaWF0IjoxNzc5ODA2MzczLCJleHAiOjE3ODA0MTExNzMsImlzcyI6InN1dGFuYS1lbXMifQ.ANVZeMq_11v1nYsh9zDZfrz5AUEzrmTRDfJLT26pWIU', '2026-05-26 18:09:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26 05:39:33'),
('18a38c3b-4740-48a6-ab11-4cfacaa90526', 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInRva2VuSWQiOiI4ZTQyMDk5My1hOTIyLTQyZTctYTdkMi0yYjI1YWUwMDVkMDgiLCJpYXQiOjE3Nzk4MjEwNzksImV4cCI6MTc4MDQyNTg3OSwiaXNzIjoic3V0YW5hLWVtcyJ9.HeulO85vmnvqpHocNUL-F2rXbEQZtr4VH7cUv7s6TrA', '2026-05-26 22:15:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26 21:44:40'),
('21aabc4b-2a31-4764-9f82-1aa56536bfd5', 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInRva2VuSWQiOiJjMTlhNGIxMC1hMTMxLTQ4ZTAtOTdhNi1mOTQxOWRjZTA3NTQiLCJpYXQiOjE3NzkzOTM0MTQsImV4cCI6MTc3OTk5ODIxNCwiaXNzIjoic3V0YW5hLWVtcyJ9.hBnl21DBOp-c4vOo97KjrvQt7vsBCretYFAFttR0c_0', '2026-05-21 23:26:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21 10:56:54'),
('2273b61e-dac3-489e-9c44-b8fe9db6a303', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInRva2VuSWQiOiJlZTNjM2IzZi0yOGFkLTQxZmQtODJjYi05OTU5NWQ5MDVhMTIiLCJpYXQiOjE3NzkwNDg3OTksImV4cCI6MTc3OTY1MzU5OSwiaXNzIjoic3V0YW5hLWVtcyJ9.NUAt_Lqw18NW9ogsut3z4pN9xNkEFiEMjk0Pj5FvfOE', '2026-05-17 23:43:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-17 11:13:19'),
('299f03e7-2cd9-4f4c-bf07-585c3e809731', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInRva2VuSWQiOiIxMjAwOWEwZi1iNzdlLTRhOTQtYjcwMi04Y2Y3NDhlNmVlNTAiLCJpYXQiOjE3Nzg4ODY4MzksImV4cCI6MTc3OTQ5MTYzOSwiaXNzIjoic3V0YW5hLWVtcyJ9.63VZDyIfXUhbi2ilz_-7jXenw5LfGqljNMztCAS0TwQ', '2026-05-16 02:43:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-15 14:13:59'),
('4e63860b-5a78-4502-8f92-a78b70af8ada', 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE4LCJ0b2tlbklkIjoiMDBiMWUzODAtMjcxNC00YWI1LTg1YjUtNjM1MDY4ODZjYjUwIiwiaWF0IjoxNzc5ODMxMjI2LCJleHAiOjE3ODA0MzYwMjYsImlzcyI6InN1dGFuYS1lbXMifQ.JwreDOgn0vzojiEdaL6heBSt87fKtFaicPAWYvzgP-g', '2026-05-27 01:04:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-27 00:33:47'),
('57a6a6ac-8986-4c26-a13e-b525c561e946', 12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJ0b2tlbklkIjoiYWZjZmRjNDMtZTZmMi00MmJlLWE5YjUtMzgwYjUxNTU1ZTc3IiwiaWF0IjoxNzc4ODA3MjQxLCJleHAiOjE3Nzk0MTIwNDEsImlzcyI6InN1dGFuYS1lbXMifQ.y8VpwlpvmzY2aQC3ZwJBaGKgzZJPGykTViMPsE8GaAs', '2026-05-15 04:37:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-14 16:07:21'),
('5c67d255-394e-45af-bd0c-d6740a0f1677', 12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJ0b2tlbklkIjoiYmQxMDNhMzctYjZhZS00ODcxLWFiNTktN2VmNjI0MzMzNTliIiwiaWF0IjoxNzc5ODAyNDc4LCJleHAiOjE3ODA0MDcyNzgsImlzcyI6InN1dGFuYS1lbXMifQ.Y0wDkGMbKhlMbFFN0cxTiTRVu3LFUJtyRXYbbmQ4q1k', '2026-05-26 17:04:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26 04:34:38'),
('74ed3932-0a6f-480a-bfa2-88f0338a157c', 20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJ0b2tlbklkIjoiYzRlYTgwNGYtMjI3NC00ZmMyLTgzMDctN2Y2NWUxMmVkYjg1IiwiaWF0IjoxNzc5OTc3NTU5LCJleHAiOjE3ODA1ODIzNTksImlzcyI6InN1dGFuYS1lbXMifQ.Vy-GFVnUQe-UtRpYgBJKxYNzmJTWMbVpwCWWAnMRqIA', '2026-05-28 17:43:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 17:12:39'),
('7c329797-9d7b-43cc-add7-62f770ffcc5f', 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE4LCJ0b2tlbklkIjoiZmZiNmUzY2ItZDY3My00NzgzLWFkNDEtOWNlNTc5NWQyMDQ5IiwiaWF0IjoxNzgwODQwMDQyLCJleHAiOjE3ODE0NDQ4NDIsImlzcyI6InN1dGFuYS1lbXMifQ.bUYftb-F8INRVtO8nImD8bH1otonUwFIz0RupCnpX6k', '2026-06-07 17:17:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-07 16:47:22'),
('7dbf5605-ced7-41af-9462-e26cba7c09b6', 19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJ0b2tlbklkIjoiZTNlZTVhMDYtN2U3YS00MGU1LWE1ODgtYzliMDk0NDIzNDA1IiwiaWF0IjoxNzc5OTYxMDg0LCJleHAiOjE3ODA1NjU4ODQsImlzcyI6InN1dGFuYS1lbXMifQ.tnTHftIm07W_p9TmmQmBQ0fIDs1duZu7EdjG5GVeTPA', '2026-05-28 13:11:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 12:38:05'),
('7fc3bee7-b6e0-43a4-9b54-716fe9e22eff', 27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI3LCJ0b2tlbklkIjoiY2I4MzMzNzQtNTZiZi00MWE5LThkNDItZjZjZmMxM2NkNTIyIiwiaWF0IjoxNzc5ODc0NjkwLCJleHAiOjE3ODA0Nzk0OTAsImlzcyI6InN1dGFuYS1lbXMifQ.kCoJe98PZ2Op0LKfxsAY-4tp3gV--yfWFNS2RhN0J30', '2026-05-27 13:08:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-27 12:38:10'),
('9b21e818-9ab5-4e1a-8ec3-3a86f50ac5d0', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInRva2VuSWQiOiJlODMyZjU5Ni0zM2RiLTQ0MjgtYjRmYy05ZjExNGRiMmIyZDIiLCJpYXQiOjE3Nzg3MTg5MjMsImV4cCI6MTc3OTMyMzcyMywiaXNzIjoic3V0YW5hLWVtcyJ9.5dfgf4QGR63maUKX5dETRs_MoNTmrt9kxR00XZKJn1w', '2026-05-14 04:05:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 15:35:23'),
('c0355335-2613-42b5-bff4-8e03a1021b75', 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE4LCJ0b2tlbklkIjoiYWU3MDBiZWEtYzlmNy00ZmEzLTk3NmMtZmVlZjI4MDhiOTM5IiwiaWF0IjoxNzc5ODcxNDg4LCJleHAiOjE3ODA0NzYyODgsImlzcyI6InN1dGFuYS1lbXMifQ.o83d8_82zs5RDXO86kfESfj9oi0yaamzOpyogoE6HJg', '2026-05-27 12:15:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-27 11:44:48'),
('c5e493c4-3529-45e0-8108-c02f3052e9b3', 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInRva2VuSWQiOiJmODRjZDhkNS03NmNkLTQ5MDEtYWU2NC0yZjI5ZTVhMWYyZGYiLCJpYXQiOjE3Nzk1OTQwMDQsImV4cCI6MTc4MDE5ODgwNCwiaXNzIjoic3V0YW5hLWVtcyJ9.qOq_HH7U1imdZkEA0PKYygVyO2s1PratPny42fjnJSo', '2026-05-24 07:10:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-23 18:40:04'),
('c80f0243-acb5-4faf-b982-0f3e9aa2b5f1', 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInRva2VuSWQiOiIyMjEwZTViZC0xNTVkLTQ1MjktOGY0OC0xZWM5ZjA3MTBkZDkiLCJpYXQiOjE3Nzg5NTgwNDUsImV4cCI6MTc3OTU2Mjg0NSwiaXNzIjoic3V0YW5hLWVtcyJ9.vI4IalnPTRmqVfCjR83JPpGrMB9mdRuFfR93UgGUUpI', '2026-05-16 22:30:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-16 10:00:45'),
('d0191c16-b4c4-4160-b812-190ff8a8d16e', 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJ0b2tlbklkIjoiZWRhMGQ4MDQtOGY0Yy00MTZiLWI1OWMtNWM5MzRmODgwNzI4IiwiaWF0IjoxNzc4ODA4MTU3LCJleHAiOjE3Nzk0MTI5NTcsImlzcyI6InN1dGFuYS1lbXMifQ.UE84W-o261oWRnyJi4E5a274-eAdQqqGfWpGZcvvtZs', '2026-05-15 04:52:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-14 16:22:37'),
('d456a161-b8e0-47e0-a287-58131ae932f5', 22, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIyLCJ0b2tlbklkIjoiMmEyYjNhNmYtYWFkMC00ZWUwLWJkZDYtODk5ZDNmOTA2MzJhIiwiaWF0IjoxNzc5OTA2NDE4LCJleHAiOjE3ODA1MTEyMTgsImlzcyI6InN1dGFuYS1lbXMifQ.gmQjJD3MWp5458XzKt9ZY9cfeyol_knxF0jCUiDhAd4', '2026-05-27 22:02:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-27 21:26:58'),
('daef4571-b617-4423-8965-74db59543238', 19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJ0b2tlbklkIjoiMzUwYjEzZGMtMDRhMi00NmZjLWI5ZGItNDUwZjk2YjNlYzhhIiwiaWF0IjoxNzc5OTYyMTg5LCJleHAiOjE3ODA1NjY5ODksImlzcyI6InN1dGFuYS1lbXMifQ.3M9xW5JaNOqr0MwTv3UWHz166DFiol9fI7MX6GHIXcw', '2026-05-28 13:26:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 12:56:29'),
('e0008c46-8afc-4679-8855-63bca939eee5', 20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJ0b2tlbklkIjoiYWUxYzU5YWEtZDVkMy00YzgxLTgwOGItYWQ3MWUwYjY4NjVmIiwiaWF0IjoxNzc5OTc3OTgxLCJleHAiOjE3ODA1ODI3ODEsImlzcyI6InN1dGFuYS1lbXMifQ.Ol9naPnl_Rwv_3K1l8V4jtGcLV9RTNoKttFNzurMzF0', '2026-05-28 17:53:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 17:19:41'),
('ee28c475-3914-4853-8b1e-695710f88e5b', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJ0b2tlbklkIjoiZTliZDE0ZTktZTVmYy00ZjllLTg2ZTEtMjgzYTMzYmM5ZDU1IiwiaWF0IjoxNzc4OTE3NTMyLCJleHAiOjE3Nzk1MjIzMzIsImlzcyI6InN1dGFuYS1lbXMifQ.2kE_D6xLp4VLi1TIhz8d1zyOW5Yzdc97jWvoQhACwaA', '2026-05-16 11:15:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-15 22:45:32'),
('efbc8bd0-146f-442a-8055-6d91af646a94', 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInRva2VuSWQiOiJkZjcyMzM3Ny1iOTkxLTRiNDEtYmI4YS1hMDM1YjQwZDc1YjYiLCJpYXQiOjE3NzkyNDM4NTEsImV4cCI6MTc3OTg0ODY1MSwiaXNzIjoic3V0YW5hLWVtcyJ9.sMVIJCmO-ryW7HmoLC1Fv0VH6X_ilgUGY4YL0V05Vh8', '2026-05-20 05:54:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-19 17:24:11'),
('f1e403bc-3ac2-4050-b169-cb64fe397e89', 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInRva2VuSWQiOiIxNmJkY2I5MS02MzllLTRiODEtYWY0YS05OGNmNGZmZDMyYzMiLCJpYXQiOjE3Nzg3NTU1MzUsImV4cCI6MTc3OTM2MDMzNSwiaXNzIjoic3V0YW5hLWVtcyJ9.uPoyOGgYMnwTP7E1gSpViBatOio2_ZT_gE1jyhtgKCc', '2026-05-14 14:15:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-14 01:45:35'),
('f3c2bd9a-a20b-4866-b17d-178daf02786b', 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInRva2VuSWQiOiJmMmI3NDc5MS0zYTZkLTQ0YTgtYjliNi1hMmU5MDQ5ZjVhZTYiLCJpYXQiOjE3Nzg5MDg3ODcsImV4cCI6MTc3OTUxMzU4NywiaXNzIjoic3V0YW5hLWVtcyJ9.XxwpxBkty1PFDT0KaJMoHnkNBA1BjRarYefwDKKElho', '2026-05-16 08:49:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-15 20:19:47'),
('fe09283a-9f3b-4f36-972f-ed35b8d57b9f', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJ0b2tlbklkIjoiZmVjMTc2ZGItYjQ3YS00N2U2LTk2ZGMtZjEzZDFkNmMxYzM5IiwiaWF0IjoxNzc4NzYxNjg4LCJleHAiOjE3NzkzNjY0ODgsImlzcyI6InN1dGFuYS1lbXMifQ.GvqN8KVmrspaDeMbsvSX6dIoBQXlsZrjiC4qSCV3NAM', '2026-05-14 15:58:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.119.1 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36', '2026-05-14 03:28:08');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `category`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'system_name', 'Sutana EMS', 'General', 'System display name', NULL, '2026-05-13 14:51:12'),
(2, 'timezone', 'Africa/Addis_Ababa', 'General', 'System timezone', NULL, '2026-05-13 14:51:12'),
(3, 'currency', 'ETB', 'General', 'System currency', NULL, '2026-05-13 14:51:12'),
(4, 'tax_rate', '15', 'General', 'Default tax rate percentage', NULL, '2026-05-13 14:51:12'),
(5, 'session_timeout_minutes', '30', 'Security', 'Session inactivity timeout', NULL, '2026-05-13 14:51:12'),
(6, 'max_failed_attempts', '5', 'Security', 'Login attempts before lockout', NULL, '2026-05-13 14:51:12'),
(7, 'lockout_minutes', '15', 'Security', 'Account lockout duration', NULL, '2026-05-13 14:51:12'),
(8, 'daily_sales_target', '100', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27'),
(9, 'monthly_sales_target', '1000', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27'),
(10, 'fulfillment_hours_target', '1', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27'),
(11, 'inventory_turnover_target', '3.5', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27'),
(12, 'customer_satisfaction_target', '77', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27'),
(13, 'profit_margin_target', '10', 'Business Rules', 'CEO configured target', 5, '2026-05-26 05:23:27');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `payment_terms_id` int(11) DEFAULT NULL,
  `lead_time_days` int(11) DEFAULT '7',
  `tax_id` varchar(50) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `payment_terms_id`, `lead_time_days`, `tax_id`, `bank_account`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Ethio Office Supplies PLC', 'Abebe Girma', '0911111111', 'supplier@ethiooffice.com', 'Addis Ababa, Bole', NULL, 7, NULL, NULL, 1, '2026-05-26 23:05:10', '2026-05-26 23:05:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `admin_reply` text,
  `replied_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `tax_receipts`
--

CREATE TABLE `tax_receipts` (
  `id` int(11) NOT NULL,
  `serial_number` varchar(20) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_type_id` int(11) NOT NULL,
  `approval_amount_total` int(11) NOT NULL,
  `used_count` int(11) DEFAULT '0',
  `remaining` int(11) NOT NULL,
  `approved_date` date NOT NULL,
  `approval_document` varchar(255) NOT NULL,
  `printed_by` int(11) NOT NULL,
  `printed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `abbreviation` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `name`, `abbreviation`) VALUES
(1, 'Pieces', 'pcs'),
(2, 'Reams', 'ream'),
(3, 'Boxes', 'box');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT '0',
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password`, `department_id`, `status_id`, `last_login`, `must_change_password`, `two_factor_enabled`, `two_factor_secret`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `reset_token`, `reset_token_expires`, `failed_login_attempts`, `lockout_until`) VALUES
(18, 'Kidist Belay', 'admin@sutana.com', '0911000000', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 1, 1, '2026-06-08 00:08:53', 1, 0, NULL, '2026-05-26 11:37:00', '2026-06-08 00:08:53', NULL, NULL, NULL, NULL, 0, NULL),
(19, 'Habtamu Abera', 'ceo@sutana.com', '0912345671', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 2, 1, '2026-05-28 05:11:20', 1, 0, NULL, '2026-05-26 11:37:42', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(20, 'Melat Sisay', 'finance@sutana.com', '0912345672', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 3, 1, '2026-05-28 05:19:41', 1, 0, NULL, '2026-05-26 11:37:42', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(21, 'Ephrem Abebe', 'printing@sutana.com', '0912345673', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 4, 1, '2026-05-27 00:37:09', 1, 0, NULL, '2026-05-26 11:37:42', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(22, 'Getaneh Mihtere', 'purchase@sutana.com', '0912345674', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 5, 1, '2026-05-28 05:10:30', 1, 0, NULL, '2026-05-26 11:37:43', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(23, 'Shibabaw Alemu', 'inventory@sutana.com', '0912345675', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 7, 1, '2026-05-28 05:11:53', 1, 0, NULL, '2026-05-26 11:37:43', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(24, 'Dereje Alemneh', 'sales@sutana.com', '0901407032', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 6, 1, '2026-05-27 20:41:51', 1, 0, NULL, '2026-05-26 11:37:43', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(25, 'Customer User', 'customer@sutana.com', '0912345676', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 6, 1, NULL, 1, 0, NULL, '2026-05-26 11:37:43', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(26, 'Misrak Tsehayneh', 'employ@sutana.com', '0936194641', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 8, 1, '2026-05-26 21:31:57', 1, 0, NULL, '2026-05-26 21:31:54', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(27, 'fekadu', 'pfekade@sutana.com', '0923456788', '$2b$10$AXzSt65MGTOoQjuxBvaMI.4BIANaETeO0z9j5amYtyWFaBQVrlYaK', 8, 1, '2026-05-27 00:38:10', 1, 0, NULL, '2026-05-27 00:34:38', '2026-06-04 09:59:47', NULL, NULL, NULL, NULL, 0, NULL),
(28, 'yonas mezgebu', 'yonasmezgebu14@gmail.com', '0950169940', '$2b$12$cFocUzeAwUlYQV97ejeA1eTbKEv11RqOGb8rq.93x6rlFPoyYPY2u', 11, 1, '2026-06-08 00:32:15', 0, 0, NULL, '2026-06-08 00:08:10', '2026-06-08 00:32:15', NULL, 18, NULL, NULL, 0, NULL),
(29, 'yonas mezgebu', 'yonasmezgebu16@gmail.com', '0901407033', '$2b$12$SG1MPH7uqvu0tiVjhRFboePyiYYuZyD/awT2x.aTTjcR2aU6gk83y', 9, 1, '2026-06-08 00:11:27', 0, 0, NULL, '2026-06-08 00:11:12', '2026-06-08 00:11:27', NULL, 18, NULL, NULL, 0, NULL),
(30, 'yonas mezgebu', 'yonasmezgebu18@gmail.com', '0901407034', '$2b$12$VksTAmMbX95kXrhBydeS5eIs6kz.Re1P04wM/GUAi9BG6y6w3nmOO', 8, 1, '2026-06-08 00:15:35', 0, 0, NULL, '2026-06-08 00:14:11', '2026-06-08 00:15:35', NULL, NULL, NULL, NULL, 0, NULL),
(31, 'yonas mezgebu', 'yonasmezgebu20@gmail.com', '0901407036', '$2b$12$cULWmw1q.Knwr/B51vzgUOm.OOHAuUG82MVgtg92axFeHMdfFCTOG', 8, 1, '2026-06-08 00:19:44', 0, 0, NULL, '2026-06-08 00:19:37', '2026-06-08 00:19:44', NULL, NULL, NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`, `assigned_by`) VALUES
(1, 1, '2026-05-26 11:04:39', 1),
(4, 8, '2026-05-13 15:30:27', NULL),
(5, 2, '2026-05-26 11:04:39', 1),
(6, 3, '2026-05-26 11:04:39', 1),
(7, 4, '2026-05-26 11:04:39', 1),
(8, 5, '2026-05-26 11:04:39', 1),
(9, 6, '2026-05-26 11:04:40', 1),
(10, 7, '2026-05-26 11:04:40', 1),
(11, 8, '2026-05-26 11:04:40', 1),
(12, 8, '2026-05-14 14:28:55', NULL),
(13, 8, '2026-05-14 16:22:32', NULL),
(14, 8, '2026-05-17 10:15:34', NULL),
(15, 8, '2026-05-26 03:31:24', NULL),
(16, 8, '2026-05-26 08:58:41', NULL),
(17, 8, '2026-05-26 09:02:08', NULL),
(18, 1, '2026-06-04 09:58:58', NULL),
(19, 2, '2026-06-04 09:58:58', NULL),
(20, 3, '2026-06-04 09:58:59', NULL),
(21, 4, '2026-06-04 09:58:59', NULL),
(22, 5, '2026-06-04 09:59:00', NULL),
(23, 6, '2026-06-04 09:59:00', NULL),
(24, 7, '2026-06-04 09:59:01', NULL),
(25, 8, '2026-06-04 09:59:01', NULL),
(26, 8, '2026-05-26 21:31:54', NULL),
(27, 8, '2026-05-27 00:34:38', NULL),
(28, 11, '2026-06-08 00:08:10', 18),
(29, 9, '2026-06-08 00:11:12', 18),
(30, 8, '2026-06-08 00:14:11', NULL),
(31, 8, '2026-06-08 00:19:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_statuses`
--

CREATE TABLE `user_statuses` (
  `id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_statuses`
--

INSERT INTO `user_statuses` (`id`, `status_code`, `status_name`, `color_hex`, `sort_order`) VALUES
(1, 'active', 'Active', '#10B981', 1),
(2, 'inactive', 'Inactive', '#6B7280', 2),
(3, 'suspended', 'Suspended', '#F59E0B', 3),
(4, 'deleted', 'Deleted', '#EF4444', 4);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_resource` (`resource`),
  ADD KEY `idx_audit_created` (`created_at`);

--
-- Indexes for table `communication_logs`
--
ALTER TABLE `communication_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_type` (`type`),
  ADD KEY `idx_logs_status` (`status`),
  ADD KEY `idx_logs_created` (`created_at`),
  ADD KEY `idx_logs_recipient` (`recipient`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_type` (`customer_type_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `customer_notifications`
--
ALTER TABLE `customer_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_customer` (`customer_id`),
  ADD KEY `idx_notifications_read` (`is_read`);

--
-- Indexes for table `customer_quotes`
--
ALTER TABLE `customer_quotes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `customer_types`
--
ALTER TABLE `customer_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expenses_category` (`category_id`),
  ADD KEY `idx_expenses_date` (`date`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `entered_by` (`entered_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_movement_product` (`product_id`),
  ADD KEY `idx_movement_type` (`transaction_type`),
  ADD KEY `idx_movement_created` (`created_at`),
  ADD KEY `performed_by` (`performed_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoice_payments_sale` (`sale_id`),
  ADD KEY `idx_invoice_payments_status` (`status_id`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `processed_by` (`processed_by`);

--
-- Indexes for table `order_statuses`
--
ALTER TABLE `order_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_history_order` (`order_id`),
  ADD KEY `idx_history_timestamp` (`changed_at`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `password_history`
--
ALTER TABLE `password_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_password_history_user` (`user_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `payment_statuses`
--
ALTER TABLE `payment_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- Indexes for table `payment_terms`
--
ALTER TABLE `payment_terms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `pos_items`
--
ALTER TABLE `pos_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pos_items_sale` (`sale_id`),
  ADD KEY `idx_pos_items_product` (`product_id`);

--
-- Indexes for table `pos_sales`
--
ALTER TABLE `pos_sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_pos_invoice` (`invoice_number`),
  ADD KEY `idx_pos_customer` (`customer_id`),
  ADD KEY `idx_pos_date` (`sale_date`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `cashier_id` (`cashier_id`),
  ADD KEY `voided_by` (`voided_by`);

--
-- Indexes for table `po_items`
--
ALTER TABLE `po_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_po_items_po` (`po_id`),
  ADD KEY `idx_po_items_product` (`product_id`);

--
-- Indexes for table `po_payments`
--
ALTER TABLE `po_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_po_payments_po` (`po_id`),
  ADD KEY `idx_po_payments_status` (`status_id`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `processed_by` (`processed_by`);

--
-- Indexes for table `po_statuses`
--
ALTER TABLE `po_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- Indexes for table `printing_orders`
--
ALTER TABLE `printing_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_number` (`order_number`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `idx_orders_status` (`status_id`),
  ADD KEY `idx_orders_due_date` (`due_date`),
  ADD KEY `customer_type_id` (`customer_type_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_sku` (`sku`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_expiry` (`expiry_date`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `idx_po_number` (`po_number`),
  ADD KEY `idx_po_supplier` (`supplier_id`),
  ADD KEY `idx_po_status` (`status_id`),
  ADD KEY `sector_id` (`sector_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sale_statuses`
--
ALTER TABLE `sale_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- Indexes for table `sectors`
--
ALTER TABLE `sectors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sessions_user` (`user_id`),
  ADD KEY `idx_sessions_expires` (`expires_at`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_settings_key` (`setting_key`),
  ADD KEY `idx_settings_category` (`category`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_suppliers_name` (`name`),
  ADD KEY `idx_suppliers_active` (`is_active`),
  ADD KEY `payment_terms_id` (`payment_terms_id`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tax_receipts`
--
ALTER TABLE `tax_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `serial_number` (`serial_number`),
  ADD KEY `idx_tax_serial` (`serial_number`),
  ADD KEY `idx_tax_order` (`order_id`),
  ADD KEY `customer_type_id` (`customer_type_id`),
  ADD KEY `printed_by` (`printed_by`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_status` (`status_id`),
  ADD KEY `idx_users_deleted_at` (`deleted_at`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `idx_user_roles_user` (`user_id`),
  ADD KEY `idx_user_roles_role` (`role_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `user_statuses`
--
ALTER TABLE `user_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=239;

--
-- AUTO_INCREMENT for table `communication_logs`
--
ALTER TABLE `communication_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customer_notifications`
--
ALTER TABLE `customer_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `customer_types`
--
ALTER TABLE `customer_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_statuses`
--
ALTER TABLE `order_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `password_history`
--
ALTER TABLE `password_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payment_statuses`
--
ALTER TABLE `payment_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payment_terms`
--
ALTER TABLE `payment_terms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pos_items`
--
ALTER TABLE `pos_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pos_sales`
--
ALTER TABLE `pos_sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `po_items`
--
ALTER TABLE `po_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `po_payments`
--
ALTER TABLE `po_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `po_statuses`
--
ALTER TABLE `po_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `printing_orders`
--
ALTER TABLE `printing_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `sale_statuses`
--
ALTER TABLE `sale_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sectors`
--
ALTER TABLE `sectors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_receipts`
--
ALTER TABLE `tax_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `user_statuses`
--
ALTER TABLE `user_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`customer_type_id`) REFERENCES `customer_types` (`id`),
  ADD CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_customer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_notifications`
--
ALTER TABLE `customer_notifications`
  ADD CONSTRAINT `customer_notifications_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
