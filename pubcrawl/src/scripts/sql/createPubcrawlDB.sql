
CREATE DATABASE `pubcrawl`;

use pubcrawl;

CREATE TABLE `cmGenes` (
  `geneName` varchar(50) NOT NULL default '',
  `somatic` tinyint(1) default NULL,
  `germline` tinyint(1) default NULL,
  `tumor_somatic` varchar(255) default NULL,
  `tumor_germline` varchar(255) default NULL,
  PRIMARY KEY  (`geneName`)
);


CREATE TABLE `tfGenes` (
  `geneName` varchar(50) NOT NULL default '',
  PRIMARY KEY  (`geneName`)
);


CREATE TABLE `domain_conn_domine` (
  `hgnc1` varchar(50) default NULL,
  `uni1` varchar(50) default NULL,
  `pf1` varchar(50) default NULL,
  `hgnc2` varchar(50) default NULL,
  `uni2` varchar(50) default NULL,
  `pf2` varchar(50) default NULL,
  `type` varchar(10) default NULL,
  KEY `hgnc_idx` (`hgnc1`,`hgnc2`),
  KEY `hgnc1_idx` (`hgnc1`),
  KEY `hgnc2_idx` (`hgnc2`),
);

CREATE TABLE `domain_counts` (
  `domain_id` varchar(50) NOT NULL default '',
  `count` int(5) default NULL,
  PRIMARY KEY  (`domain_id`)
);


CREATE TABLE `singletermcount` (
  `term1` varchar(255) NOT NULL default '',
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);


CREATE TABLE `singletermcount_alias` (
  `term1` varchar(255) NOT NULL default '',
  `alias` varchar(255) default NULL,
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);

CREATE TABLE `singletermcount_denovo` (
  `term1` varchar(255) NOT NULL default '',
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);


CREATE TABLE `singletermcount_denovo_alias` (
  `term1` varchar(255) NOT NULL default '',
  `alias` varchar(255) default NULL,
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);


CREATE TABLE `ngd` (
  `term1` varchar(255) NOT NULL,
  `term2` varchar(255) NOT NULL,
  `term1count` int(11) NOT NULL,
  `term2count` int(11) NOT NULL,
  `combocount` int(11) NOT NULL,
  `ngd` decimal(21,10) NOT NULL,
  `ngd_trunc` decimal(12,2) NOT NULL,
  PRIMARY KEY `ngd_term_combo` (`term1`,`term2`,`ngd`),
  UNIQUE KEY `ngd_filter_idx` (`combocount`,`term1`,`term2`)
);

CREATE TRIGGER upd_ngdtrunc BEFORE INSERT ON ngd
FOR EACH ROW SET NEW.ngd_trunc = truncate(NEW.ngd,2);


CREATE TABLE `ngd_alias` (
  `term1` varchar(255) NOT NULL,
  `term2` varchar(255) NOT NULL,
  `term1count` int(11) NOT NULL,
  `term2count` int(11) NOT NULL,
  `combocount` int(11) NOT NULL,
  `ngd` decimal(21,10) NOT NULL,
  `ngd_trunc` decimal(12,2) default NULL,
  `alias1` varchar(255) default NULL,
  `alias2` varchar(255) default NULL,
    PRIMARY KEY `ngd_term_combo` (`term1`,`term2`,`ngd`),
  UNIQUE KEY `ngd_filter_idx` (`combocount`,`term1`,`term2`)
);

CREATE TRIGGER upd_ngdtrunc_alias BEFORE INSERT ON ngd_alias
FOR EACH ROW SET NEW.ngd_trunc = truncate(NEW.ngd,2);

CREATE TABLE `ngd_denovo` (
  `term1` varchar(255) NOT NULL,
  `term2` varchar(255) NOT NULL,
  `term1count` int(11) NOT NULL,
  `term2count` int(11) NOT NULL,
  `combocount` int(11) NOT NULL,
  `ngd` decimal(21,10) NOT NULL,
  `ngd_trunc` decimal(12,2) default NULL,
    PRIMARY KEY `ngd_term_combo` (`term1`,`term2`,`ngd`),
  UNIQUE KEY `ngd_filter_idx` (`combocount`,`term1`,`term2`)
);

CREATE TRIGGER upd_ngdtrunc_denovo BEFORE INSERT ON ngd_denovo
FOR EACH ROW SET NEW.ngd_trunc = truncate(NEW.ngd,2);

CREATE TABLE `ngd_denovo_alias` (
  `term1` varchar(255) NOT NULL,
  `term2` varchar(255) NOT NULL,
  `term1count` int(11) NOT NULL,
  `term2count` int(11) NOT NULL,
  `combocount` int(11) NOT NULL,
  `ngd` decimal(21,10) NOT NULL,
  `ngd_trunc` decimal(12,2) default NULL,
  `alias1` varchar(255) default NULL,
  `alias2` varchar(255) default NULL,
  PRIMARY KEY `ngd_term_combo` (`term1`,`term2`,`ngd`),
  UNIQUE KEY `ngd_filter_idx` (`combocount`,`term1`,`term2`)
);


CREATE TRIGGER upd_ngdtrunc_denovo_alias BEFORE INSERT ON ngd_denovo_alias
FOR EACH ROW SET NEW.ngd_trunc = truncate(NEW.ngd,2);


CREATE  VIEW `edgeMap` AS select `d`.`hgnc1` AS `hgnc1`,
`d`.`hgnc2` AS `hgnc2`,`c`.`ngd` AS `ngd`,`d`.`pf1` AS `pf1`,`d`.`pf2` AS `pf2`,
`d`.`uni1` AS `uni1`,`d`.`uni2` AS `uni2`,`a`.`term1` AS `combo1`,`b`.`term1` AS `combo2`,
`d`.`type` AS `type`,`dc1`.`count` AS `pf1_count`,`dc2`.`count` AS `pf2_count`,
(`a`.`ngd` + `b`.`ngd`) AS `ngd_sum` from (((`domain_conn_domine` `d` join (`ngd` `a` join `ngd` `b`)
on(((`a`.`term2` = `d`.`hgnc1`) and (`b`.`term2` = `d`.`hgnc2`))))
left join (`domain_counts` `dc1` join `domain_counts` `dc2`)
on(((`dc1`.`domain_id` = `d`.`pf1`) and (`dc2`.`domain_id` = `d`.`pf2`))))
left join `ngd` `c` on(((`c`.`term1` = `a`.`term2`) and (`c`.`term2` = `b`.`term2`))))
where (`d`.`hgnc1` <> `d`.`hgnc2`);


CREATE  VIEW `edgeMap_alias` AS select `d`.`hgnc1` AS `hgnc1`,`d`.`hgnc2` AS `hgnc2`,`c`.`ngd` AS `ngd`,`d`.`pf1` AS `pf1`,`d`.`pf2` AS `pf2`,`d`.`uni1` AS `uni1`,`d`.`uni2` AS `uni2`,`a`.`term1` AS `combo1`,`b`.`term1` AS `combo2`,`d`.`type` AS `type`,`dc1`.`count` AS `pf1_count`,`dc2`.`count` AS `pf2_count`,(`a`.`ngd` + `b`.`ngd`) AS `ngd_sum` from (((`domain_conn_domine` `d` join (`ngd_alias` `a` join `ngd_alias` `b`) on(((`a`.`term2` = `d`.`hgnc1`) and (`b`.`term2` = `d`.`hgnc2`)))) left join (`domain_counts` `dc1` join `domain_counts` `dc2`) on(((`dc1`.`domain_id` = `d`.`pf1`) and (`dc2`.`domain_id` = `d`.`pf2`)))) left join `ngd_alias` `c` on(((`c`.`term1` = `a`.`term2`) and (`c`.`term2` = `b`.`term2`)))) where (`d`.`hgnc1` <> `d`.`hgnc2`)

CREATE   VIEW `edgeMap_denovo` AS select `d`.`hgnc1` AS `hgnc1`,`d`.`hgnc2` AS `hgnc2`,`c`.`ngd` AS `ngd`,`d`.`pf1` AS `pf1`,`d`.`pf2` AS `pf2`,`d`.`uni1` AS `uni1`,`d`.`uni2` AS `uni2`,`a`.`term1` AS `combo1`,`b`.`term1` AS `combo2`,`d`.`type` AS `type`,`dc1`.`count` AS `pf1_count`,`dc2`.`count` AS `pf2_count`,(`a`.`ngd` + `b`.`ngd`) AS `ngd_sum` from (((`domain_conn_domine` `d` join (`ngd_denovo` `a` join `ngd_denovo` `b`) on(((`a`.`term2` = `d`.`hgnc1`) and (`b`.`term2` = `d`.`hgnc2`)))) left join (`domain_counts` `dc1` join `domain_counts` `dc2`) on(((`dc1`.`domain_id` = `d`.`pf1`) and (`dc2`.`domain_id` = `d`.`pf2`)))) left join `ngd` `c` on(((`c`.`term1` = `a`.`term2`) and (`c`.`term2` = `b`.`term2`)))) where (`d`.`hgnc1` <> `d`.`hgnc2`)


CREATE VIEW `edgeMap_denovo_alias` AS select `d`.`hgnc1` AS `hgnc1`,`d`.`hgnc2` AS `hgnc2`,`c`.`ngd` AS `ngd`,`d`.`pf1` AS `pf1`,`d`.`pf2` AS `pf2`,`d`.`uni1` AS `uni1`,`d`.`uni2` AS `uni2`,`a`.`term1` AS `combo1`,`b`.`term1` AS `combo2`,`d`.`type` AS `type`,`dc1`.`count` AS `pf1_count`,`dc2`.`count` AS `pf2_count`,(`a`.`ngd` + `b`.`ngd`) AS `ngd_sum` from (((`domain_conn_domine` `d` join (`ngd_denovo_alias` `a` join `ngd_denovo_alias` `b`) on(((`a`.`term2` = `d`.`hgnc1`) and (`b`.`term2` = `d`.`hgnc2`)))) left join (`domain_counts` `dc1` join `domain_counts` `dc2`) on(((`dc1`.`domain_id` = `d`.`pf1`) and (`dc2`.`domain_id` = `d`.`pf2`)))) left join `ngd` `c` on(((`c`.`term1` = `a`.`term2`) and (`c`.`term2` = `b`.`term2`)))) where (`d`.`hgnc1` <> `d`.`hgnc2`)


CREATE VIEW `combocount_summary` AS select `ngd`.`combocount` AS `combocount`,
                            count(`ngd`.`combocount`) AS `count`,
                            `ngd`.`term1` AS `term` from `ngd`
                            group by `ngd`.`combocount`,`ngd`.`term1`;

CREATE VIEW `combocount_summary_alias` AS select `ngd_alias`.`combocount` AS `combocount`,
                            count(`ngd_alias`.`combocount`) AS `count`,
                            `ngd_alias`.`term1` AS `term` from `ngd_alias`
                            group by `ngd_alias`.`combocount`,`ngd_alias`.`term1`;


CREATE VIEW `combocount_summary_denovo` AS select `ngd_denovo`.`combocount` AS `combocount`,
                            count(`ngd_denovo`.`combocount`) AS `count`,
                            `ngd_denovo`.`term1` AS `term` from `ngd_denovo`
                            group by `ngd_denovo`.`combocount`,`ngd_denovo`.`term1`;

CREATE VIEW `combocount_summary_denovo_alias` AS select `ngd_denovo_alias`.`combocount` AS `combocount`,
                            count(`ngd_denovo_alias`.`combocount`) AS `count`,
                            `ngd_denovo_alias`.`term1` AS `term` from `ngd_denovo_alias`
                            group by `ngd_denovo_alias`.`combocount`,`ngd_denovo_alias`.`term1`;

CREATE VIEW `ngd_summary` AS select `ngd`.`ngd_trunc` AS `ngd`,
                count(`ngd`.`ngd_trunc`) AS `count`,
                `ngd`.`term1` AS `term` from `ngd`
                group by `ngd`.`ngd_trunc`,`ngd`.`term1`;

CREATE VIEW `ngd_summary_alias` AS select `ngd_alias`.`ngd_trunc` AS `ngd`,
            count(`ngd_alias`.`ngd_trunc`) AS `count`,`ngd_alias`.`term1` AS `term`
            from `ngd_alias` group by `ngd_alias`.`ngd_trunc`,`ngd_alias`.`term1`;

CREATE VIEW `ngd_summary_denovo` AS select `ngd_denovo`.`ngd_trunc` AS `ngd`,
                count(`ngd_denovo`.`ngd_trunc`) AS `count`,
                `ngd_denovo`.`term1` AS `term` from `ngd_denovo`
                group by `ngd_denovo`.`ngd_trunc`,`ngd_denovo`.`term1`;

CREATE VIEW `ngd_summary_denovo_alias` AS select `ngd_denovo_alias`.`ngd_trunc` AS `ngd`,
            count(`ngd_denovo_alias`.`ngd_trunc`) AS `count`,`ngd_denovo_alias`.`term1` AS `term`
            from `ngd_denovo_alias` group by `ngd_denovo_alias`.`ngd_trunc`,`ngd_denovo_alias`.`term1`;


CREATE TABLE `term_aliases` (
  `alias_id` int(11) NOT NULL default '0',
  `value` varchar(255) NOT NULL default '',
  `exclude` tinyint(1) NOT NULL,
  PRIMARY KEY  (`alias_id`,`value`)
);

 CREATE TABLE `term_mapping` (
  `term_id` int(11) NOT NULL,
  `term_value` varchar(255) NOT NULL,
  `exclude` tinyint(1) NOT NULL,
  PRIMARY KEY  (`term_id`,`term_value`)
);

 CREATE TABLE `denovo_search_terms` (
  `term_value` varchar(255) NOT NULL,
  `term_alias` varchar(255),
  `alias` tinyint(1) NOT NULL
);