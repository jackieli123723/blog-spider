

CREATE TABLE `mall_mamicode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `href` varchar(50) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `paperType` varchar(250) DEFAULT NULL,
  `author` varchar(150) DEFAULT NULL,
  `loveNum` varchar(150) DEFAULT NULL,
  `contentPre` text,
  `content` text,
  `originId` varchar(255) DEFAULT NULL,
  `originTime` varchar(1050) DEFAULT NULL,
  `crawlerTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8