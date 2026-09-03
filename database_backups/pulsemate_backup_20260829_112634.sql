--
-- PostgreSQL database dump
--

\restrict cyDZtva2FZnXsYdPPUTCgfaxg9hf0YFv6pw2eshKDkCAXqqpJwSh0ZPKxVWrmOq

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('cd3c9128-1a70-41ac-8753-38d0858616a5', 'cbd55253bc35ebf45f60048c4b3512301b857c8e07ecb3ef82c83767f95f7645', '2026-08-15 16:22:28.067912+00', '20260526000000_baseline', NULL, NULL, '2026-08-15 16:22:26.122904+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4b8aff8d-0cbf-430c-9636-dcbda0d8008f', '912c9cd6d393099b65909ea3c6063b0a78e17b8c84a4f9856ad777e7b751c389', '2026-08-15 16:22:55.409621+00', '20260607200000_free_booking_benefit', NULL, NULL, '2026-08-15 16:22:53.874568+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('fb7872ad-65d1-42b1-991e-1ba6f724af53', '8a3b247324221e990ef7c60800dce16728aea378923f899326677debbfa2b401', '2026-08-15 16:22:30.115879+00', '20260528054040_auth_role_upgrade', NULL, NULL, '2026-08-15 16:22:28.585598+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d54cf8f2-d76e-4dee-8ef7-382bbfef7a09', 'a80b7d5fde9e178ed77333b99e9704caf9f2f7e76bc3093ed3694a8e9fa0d088', '2026-08-15 16:22:32.164256+00', '20260528061950_password_reset_email_flow', NULL, NULL, '2026-08-15 16:22:30.730821+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('52e8ec11-0a8b-4d90-a490-0996361eacbb', '357771f24b7bb8428754aaf08061645a362c2cce1315844e2084a95e9513a856', '2026-08-15 16:23:10.053819+00', '20260627213212_add_doctor_availability', NULL, NULL, '2026-08-15 16:23:08.712548+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('80e0eb90-1dd3-4a59-aa02-c8e07b033a73', '7bd3c804bac9202b34fbed634e262b953ed588e0b986f7b1b7b6735aa54272c4', '2026-08-15 16:22:34.211886+00', '20260528151027_clinic_onboarding_upgrade', NULL, NULL, '2026-08-15 16:22:32.777731+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('64bce830-144c-4e97-b885-1c39b1203b1d', '4775f49830a07af4bec58efa5548a6a1fa58dab7e7d4ba0ef11fd09b830fc680', '2026-08-15 16:22:57.457326+00', '20260608000000_campaign_notifications', NULL, NULL, '2026-08-15 16:22:56.024504+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e8b39771-d79b-4e41-8c28-12c625e48d8f', '3234fedeb0042f617cfc3ea017ef2295b40d07983323022a1fed1d67a3a7d03d', '2026-08-15 16:22:36.15791+00', '20260528214500_clinic_onboarding_upgrade', NULL, NULL, '2026-08-15 16:22:34.826966+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2c8d4eda-a4dd-40ea-978d-8bfe5abb4c74', '4ee742692fbd4247f5d15ceab54d4476f2d61a584d0969794063ce6432d2b98e', '2026-08-15 16:22:38.103834+00', '20260529190000_email_verification_upgrade', NULL, NULL, '2026-08-15 16:22:36.566762+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('43e7531b-8ecc-4b5b-8590-3419ea10c29e', 'a71adfea1c0a1630b757248f27d8b0ae3b583e9b8c4d3c55cad6597240ed4b19', '2026-08-15 16:22:40.152069+00', '20260530110000_clinic_other_fields', NULL, NULL, '2026-08-15 16:22:38.71827+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0a4d791f-202b-4076-812a-7052481cfbb5', '5243fdeb091e49e97d2cc959fa66f34565fa46b59f9db59b7c2e4ed228490710', '2026-08-15 16:22:59.506072+00', '20260610000000_firebase_uid', NULL, NULL, '2026-08-15 16:22:58.073262+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3f75570b-4bbe-47b3-b756-dc2c24eb4e28', 'eb795a93bc4993c815ffbac5a6322d2afb0ba8a5e9e783e45f88339c6958be69', '2026-08-15 16:22:42.199397+00', '20260530125000_clinic_district', NULL, NULL, '2026-08-15 16:22:40.766402+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3cfb227f-b166-44e1-91c7-1fc4760bfd9b', '0a21b5edc0778dd1a8e9bea3939d409042da7c20a3bc33d0cfa6e5b1f61ace98', '2026-08-15 16:22:44.548071+00', '20260602000000_clinic_approval_upgrade', NULL, NULL, '2026-08-15 16:22:42.712534+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4562d1c6-16dc-49af-89bd-9ce6ba6bc0fb', 'b169643a977a501cdc6d66d920e034a0d7ff5f33a62c159c84a530ac7b764c9d', '2026-08-15 16:22:46.500568+00', '20260606000000_appointment_reminders', NULL, NULL, '2026-08-15 16:22:45.070824+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('39c9cea5-9aa8-48c7-b51e-c7078f37e2ea', 'f33ef08751f412e65dbf8d28d9e74ec835875b3a9e1f40aebeb01c1ec53f463a', '2026-08-15 16:23:01.348546+00', '20260612083022_add_doctor_management_fields', NULL, NULL, '2026-08-15 16:23:00.062398+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('fc105e62-c13a-4aef-94ab-5627ba79e086', 'cf3bf2f1d418e9edde7000fa9b4fcf625c2a6b0c1a398577419b533461ba8acb', '2026-08-15 16:22:48.557959+00', '20260607000000_doctor_availability', NULL, NULL, '2026-08-15 16:22:47.115232+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('41239695-f15a-48c2-a45f-08c9f967b513', '1bf2c98ac5a099724f42839333f640e383c42ba670ce28facafb2cbcef102a8b', '2026-08-15 16:22:50.596464+00', '20260607100000_remove_prescriptions', NULL, NULL, '2026-08-15 16:22:49.163452+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0e86c10e-149d-4338-9f91-f5f097e254bf', '5e1c24a39c2736cd60cc78ad2838205ab88ac98aabfc7cf846f97f3f8715382a', '2026-08-15 16:23:11.90038+00', '20260628140314_add_clinic_holidays', NULL, NULL, '2026-08-15 16:23:10.58277+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('1f10d24d-057d-4486-8b14-727fff6c7c85', 'd23ad9584d0f7a8c3fdce0b7e634e8719dd009d30aaffc7f95914b521ed8cc24', '2026-08-15 16:22:52.529632+00', '20260607110000_notification_reads', NULL, NULL, '2026-08-15 16:22:51.20527+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7ea29f55-4e0f-45bc-b623-b467656808a4', 'accb041bf1644b0360a694484bb0963d065657564c21db799f82aa728fccf823', '2026-08-15 16:23:03.192524+00', '20260612120000_firebase_phone_verification', NULL, NULL, '2026-08-15 16:23:01.862043+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7f4b7b46-2e74-41bc-84de-88f93decaaf2', 'c4a2210404a44f365dd3538e28416cdd3d965efb85d6971ad34ae693d07f2ba7', '2026-08-15 16:23:05.208853+00', '20260626104307_add_clinic_sessions_table', NULL, NULL, '2026-08-15 16:23:03.80719+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('51b82203-cf49-42e0-b189-ff859aa79471', '7c90c56852a56ad0af0395795376d2f3f7c10e8a891516838d34c26080179462', '2026-08-15 16:23:06.881562+00', '20260626113205_add_session_type_enum', NULL, NULL, '2026-08-15 16:23:05.639883+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2e175895-bd2b-4355-a9e1-3cfff104564c', 'ea3666f4aaec1e50cea61231dbac063cd3e097cee5fe7286324b4d72e8779ac1', '2026-08-15 16:23:13.751607+00', '20260700000000_dashboard_enhancements', NULL, NULL, '2026-08-15 16:23:12.459336+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('494944d4-4866-4ff7-b84b-ecbad11d728f', 'd3a10f039457e71cfc287c0b4aa1f4f49babd3d546e8dbd90dc4abbf86c9752d', '2026-08-15 16:23:08.31663+00', '20260627000000_account_deletion_queue', NULL, NULL, '2026-08-15 16:23:07.293319+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f54b9e52-a28d-4db4-9ccb-6e48317f6810', 'ffc03c226282ff1e74126db772b2747291d372ae1b53ff048901353f4b4aff12', '2026-08-15 16:23:15.480222+00', '20260702000000_add_avg_consultation_mins_to_session', NULL, NULL, '2026-08-15 16:23:14.1516+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('1ce7bf9e-a689-41db-b8aa-ad3086369e54', '88a7f4bc96ea0326d07b033f53e56a79f88ed6e50c15fad6838190e497151415', '2026-08-15 16:23:17.938252+00', '20260703000000_session_based_queues', NULL, NULL, '2026-08-15 16:23:15.993821+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('521e22d3-ceeb-4419-a935-66dceddfef14', '75bbf755139b2fdaacc10e33230b8f1522c27d0a7c58a3929a585b9cef651562', NULL, '20260725155225_add_clinic_owner_profile', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260725155225_add_clinic_owner_profile

Database error code: 42P07

Database error:
ERROR: relation "queues_clinicId_doctorId_date_sessionId_key" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \"queues_clinicId_doctorId_date_sessionId_key\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("index.c"), line: Some(897), routine: Some("index_create") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260725155225_add_clinic_owner_profile"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260725155225_add_clinic_owner_profile"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-15 16:26:45.817719+00', '2026-08-15 16:23:18.381126+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4f4490f1-f637-4e63-88d1-9d0bd90268e6', '75bbf755139b2fdaacc10e33230b8f1522c27d0a7c58a3929a585b9cef651562', '2026-08-15 16:26:46.431986+00', '20260725155225_add_clinic_owner_profile', '', NULL, '2026-08-15 16:26:46.431986+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ac141e6a-bb34-4c51-8888-b89885f83e14', 'c979d85f5ed50adab95466d1b2c77d74f0cc70937b3f6f38ecfd0f7f3c747cf3', '2026-08-19 11:51:43.577518+00', '20260728000000_add_notification_enhanced_system', NULL, NULL, '2026-08-19 11:51:42.676976+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('a0276ea5-a622-4e7e-bd05-7ad15e210b1a', '22d126cd63a5d20a7aa71d722066c255fa7ff9b4a5c9ebf227164fbebdb22057', NULL, '20260809_critical_bug_fixes', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260809_critical_bug_fixes

Database error code: 42P17

Database error:
ERROR: functions in index expression must be marked IMMUTABLE

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P17), message: "functions in index expression must be marked IMMUTABLE", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("indexcmds.c"), line: Some(1948), routine: Some("ComputeIndexAttrs") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-19 11:52:23.646479+00', '2026-08-19 11:51:43.880674+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('cae663fd-0d6a-418d-8c36-109e92702f0e', 'd169f1cfeef425751d9d209b031d33d8f3fc821b0c2f35300a4650113b250540', NULL, '20260809_critical_bug_fixes', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260809_critical_bug_fixes

Database error code: 23505

Database error:
ERROR: could not create unique index "idx_unique_queue_number"
DETAIL: Key ("queueId", "queueNumber")=(164aaead-0cb7-494d-a728-7a6a908b8feb, 2) is duplicated.

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E23505), message: "could not create unique index \"idx_unique_queue_number\"", detail: Some("Key (\"queueId\", \"queueNumber\")=(164aaead-0cb7-494d-a728-7a6a908b8feb, 2) is duplicated."), hint: None, position: None, where_: None, schema: Some("public"), table: Some("queue_items"), column: None, datatype: None, constraint: Some("idx_unique_queue_number"), file: Some("tuplesortvariants.c"), line: Some(1550), routine: Some("comparetup_index_btree_tiebreak") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-19 11:54:31.656909+00', '2026-08-19 11:53:01.483267+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('959f1df4-8320-4245-87ea-46fad6ccccc8', 'd169f1cfeef425751d9d209b031d33d8f3fc821b0c2f35300a4650113b250540', NULL, '20260809_critical_bug_fixes', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260809_critical_bug_fixes

Database error code: 23505

Database error:
ERROR: could not create unique index "idx_unique_queue_number"
DETAIL: Key ("queueId", "queueNumber")=(164aaead-0cb7-494d-a728-7a6a908b8feb, 10043) is duplicated.

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E23505), message: "could not create unique index \"idx_unique_queue_number\"", detail: Some("Key (\"queueId\", \"queueNumber\")=(164aaead-0cb7-494d-a728-7a6a908b8feb, 10043) is duplicated."), hint: None, position: None, where_: None, schema: Some("public"), table: Some("queue_items"), column: None, datatype: None, constraint: Some("idx_unique_queue_number"), file: Some("tuplesortvariants.c"), line: Some(1550), routine: Some("comparetup_index_btree_tiebreak") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260809_critical_bug_fixes"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-19 11:55:33.141968+00', '2026-08-19 11:54:51.029749+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0b1275cf-f1fc-453a-86f0-f4dfaecbbdce', '75753a6a0d380fe8faf672acea0c8bd0562cb12c3ff80d2c240310a0db1407d8', NULL, '20260813011003_add_clinic_onboarding_data', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260813011003_add_clinic_onboarding_data

Database error code: 42701

Database error:
ERROR: column "clinicOnboardingData" of relation "users" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \"clinicOnboardingData\" of relation \"users\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7478), routine: Some("check_for_column_name_collision") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260813011003_add_clinic_onboarding_data"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260813011003_add_clinic_onboarding_data"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-19 11:56:27.259153+00', '2026-08-19 11:55:56.829515+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ab8e419d-0942-4741-8b42-49aabf9365d3', 'd169f1cfeef425751d9d209b031d33d8f3fc821b0c2f35300a4650113b250540', '2026-08-19 11:55:56.510924+00', '20260809_critical_bug_fixes', NULL, NULL, '2026-08-19 11:55:55.769063+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8bfc7deb-9e15-480b-8993-4953cfb1cb71', '75753a6a0d380fe8faf672acea0c8bd0562cb12c3ff80d2c240310a0db1407d8', '2026-08-19 11:56:27.551489+00', '20260813011003_add_clinic_onboarding_data', '', NULL, '2026-08-19 11:56:27.551489+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9682c68b-a3fc-42b4-8a19-09c21a2e0f7c', '45fd3fe308f58433fcd9b323a21c603d349223134bd2b1932459f90ebb99353e', '2026-08-19 16:40:17.807803+00', 'add_patient_audit_fields', NULL, NULL, '2026-08-19 16:40:17.404587+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('bb422f2e-1924-415d-8f54-e4d3c57ab7d4', 'a40cb010af3387a50c74118caecd7b8173be9b13a0544445f32f424a74b39a0a', NULL, 'PHASE1_add_multi_role_support', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: PHASE1_add_multi_role_support

Database error code: 22P02

Database error:
ERROR: invalid input value for enum "ApprovalStatus": "APPROVED"

Position:
[1m 47[0m
[1m 48[0m -- Step 4: Migrate existing data
[1m 49[0m -- Copy current role to roles array and primaryRole
[1m 50[0m UPDATE "users" 
[1m 51[0m SET 
[1m 52[1;31m     "roles" = ARRAY["role"::TEXT],[0m

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E22P02), message: "invalid input value for enum \"ApprovalStatus\": \"APPROVED\"", detail: None, hint: None, position: Some(Original(2902)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("enum.c"), line: Some(129), routine: Some("enum_in") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="PHASE1_add_multi_role_support"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="PHASE1_add_multi_role_support"
             at schema-engine\core\src\commands\apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226', '2026-08-23 09:42:18.623629+00', '2026-08-23 09:41:43.742961+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0c082df4-cfc6-4ecd-9d7d-7374fcbbccc7', 'cfd40620090869ed72693da284d2bba9e64385f42166a3afe60b55f946e62b67', '2026-08-23 09:47:40.451678+00', 'PHASE1_add_multi_role_support', NULL, NULL, '2026-08-23 09:47:39.643378+00', 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, name, mobile, email, role, "approvalStatus", "passwordHash", "rejectionReason", "suspendedReason", "isActive", "lastLoginAt", "createdAt", "updatedAt", "isEmailVerified", "isPhoneVerified", "freeBookingUsed", "freeBookingUsedAt", "firebaseUid", "authProvider", "deletionRequestedAt", "clinicOnboardingData", roles, "primaryRole") VALUES ('d6786371-c252-43a2-9e89-a35f68e42850', 'Shubham', '+919876543210', 'shubham27052002@gmail.com', 'SUPER_ADMIN', 'VERIFIED', '$2a$12$cCq516dhh0ad41AY7s1mzedor.m410bnPPTwQ8ObTtlQr/fNrp9QW', NULL, NULL, true, NULL, '2026-08-29 04:22:37.476', '2026-08-29 04:26:02.829', true, true, false, NULL, NULL, NULL, NULL, NULL, '{SUPER_ADMIN}', 'SUPER_ADMIN');
INSERT INTO public.users (id, name, mobile, email, role, "approvalStatus", "passwordHash", "rejectionReason", "suspendedReason", "isActive", "lastLoginAt", "createdAt", "updatedAt", "isEmailVerified", "isPhoneVerified", "freeBookingUsed", "freeBookingUsedAt", "firebaseUid", "authProvider", "deletionRequestedAt", "clinicOnboardingData", roles, "primaryRole") VALUES ('04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'Sahil Naik', '+917022818878', 'sahilnaik1515@gmail.com', 'SUPER_ADMIN', 'VERIFIED', '$2a$12$5zpAzrovHHEx1HtJeYYNo.qKsSW4d3a0cdTuF.37lFeT7scKy7RUe', NULL, NULL, true, '2026-08-29 04:28:47.754', '2026-08-29 04:22:38.694', '2026-08-29 04:28:47.756', true, true, false, NULL, NULL, NULL, NULL, NULL, '{SUPER_ADMIN}', 'SUPER_ADMIN');
INSERT INTO public.users (id, name, mobile, email, role, "approvalStatus", "passwordHash", "rejectionReason", "suspendedReason", "isActive", "lastLoginAt", "createdAt", "updatedAt", "isEmailVerified", "isPhoneVerified", "freeBookingUsed", "freeBookingUsedAt", "firebaseUid", "authProvider", "deletionRequestedAt", "clinicOnboardingData", roles, "primaryRole") VALUES ('890e4b68-d955-448b-be92-b715f4b10807', 'ooooooo', '+917977999149', 'contactspineclinic@gmail.com', 'CLINIC_OWNER', 'PENDING', NULL, NULL, NULL, true, NULL, '2026-08-29 04:33:19.151', '2026-08-29 04:33:19.151', true, false, false, NULL, NULL, 'EMAIL_OTP', NULL, NULL, '{PATIENT}', 'PATIENT');


--
-- Data for Name: admin_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admin_profiles (id, "userId", level, "createdById", "createdAt", "updatedAt") VALUES ('f2603ee7-b797-40c4-81ca-fd3501b1505d', 'd6786371-c252-43a2-9e89-a35f68e42850', 'ROOT', NULL, '2026-08-29 04:22:37.476', '2026-08-29 04:22:37.476');
INSERT INTO public.admin_profiles (id, "userId", level, "createdById", "createdAt", "updatedAt") VALUES ('8334725c-a817-480f-a6ce-d8f02164e089', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'SUPER_ADMIN', 'd6786371-c252-43a2-9e89-a35f68e42850', '2026-08-29 04:22:38.694', '2026-08-29 04:22:38.694');


--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: doctor_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: doctor_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.audit_logs (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('f88ec73c-e21f-45bc-803f-d2b7d3348d52', 'd6786371-c252-43a2-9e89-a35f68e42850', 'DATABASE_RESET', 'System', NULL, '{"resetAt": "2026-08-29T04:22:39.428Z", "triggeredBy": {"id": "7fe66b1a-35e1-4e99-8c03-c3774c433b93", "name": "Sahil Naik", "email": "sahilnaik1515@gmail.com"}, "adminsCreated": [{"email": "shubham27052002@gmail.com", "level": "ROOT"}, {"email": "sahilnaik1515@gmail.com", "level": "SUPER_ADMIN"}]}', '127.0.0.1', '2026-08-29 04:22:39.43');
INSERT INTO public.audit_logs (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('77892935-3ce3-427f-b43f-6132c8708707', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'LOGIN_SUPER_ADMIN', 'User', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'null', '127.0.0.1', '2026-08-29 04:23:01.859');
INSERT INTO public.audit_logs (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('8cb0e622-85b8-484f-9f9c-a1bc5bb95ed3', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'LOGIN_SUPER_ADMIN', 'User', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'null', '127.0.0.1', '2026-08-29 04:23:26.346');
INSERT INTO public.audit_logs (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('5f901443-0659-4946-90b0-2ef640a83cda', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'LOGIN_SUPER_ADMIN', 'User', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'null', '127.0.0.1', '2026-08-29 04:28:49.995');
INSERT INTO public.audit_logs (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('5bc85f07-a15f-4de9-b2d3-81c013f30be5', '890e4b68-d955-448b-be92-b715f4b10807', 'CLINIC_OWNER_REGISTERED_EMAIL_OTP', 'User', '890e4b68-d955-448b-be92-b715f4b10807', '{"provider": "EMAIL_OTP", "hasClinic": false, "isNewUser": true}', '127.0.0.1', '2026-08-29 04:33:23.017');


--
-- Data for Name: broadcast_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_appointment_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_breaks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_owner_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinic_owner_profiles (id, "userId", "primaryClinicId", "businessName", designation, "profilePhoto", "alternatePhone", "businessAddress", "gstNumber", "panNumber", bio, "linkedInProfile", "yearsInHealthcare", "totalClinics", "profileCompleted", "createdAt", "updatedAt") VALUES ('59c49539-9bea-42be-95f2-648cd1303a00', '890e4b68-d955-448b-be92-b715f4b10807', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, false, '2026-08-29 04:33:19.151', '2026-08-29 04:33:19.151');


--
-- Data for Name: clinic_queue_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_special_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_staff; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_temporary_closures; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_verification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clinic_working_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dashboard_widget_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: doctor_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: doctor_verification_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: doctor_verification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fcm_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: firebase_phone_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_delivery_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: otp_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: otp_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.otp_verifications (id, mobile, purpose, "otpHash", "expiresAt", attempts, "verifiedAt", "createdAt", "isUsed", "maxAttempts") VALUES ('80f032e0-e28f-4567-91e8-b461ede60af2', 'contactspineclinic@gmail.com', 'SIGNUP', '$2a$12$jM4.1nvV8uTBZqY2rC96hugpe64u7s5a3BFuWfMpei0oRz7kROVgO', '2026-08-29 04:42:56.801', 0, '2026-08-29 04:33:18.498', '2026-08-29 04:32:56.802', true, 5);


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: patient_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: queue_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: receptionist_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.refresh_tokens (id, "userId", "tokenHash", "jwtId", "expiresAt", "revokedAt", "replacedByToken", "deviceInfo", "ipAddress", "createdAt") VALUES ('e35956e5-2ebc-4969-a260-618e24cd98d2', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', '68c473177905cd1c6abc10059c72133da3221a945b645c358816a7735a4d0730', '2ca08940-e4a4-4124-a800-84b82f49f97f', '2026-09-28 04:23:01.541', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '127.0.0.1', '2026-08-29 04:23:01.545');
INSERT INTO public.refresh_tokens (id, "userId", "tokenHash", "jwtId", "expiresAt", "revokedAt", "replacedByToken", "deviceInfo", "ipAddress", "createdAt") VALUES ('ea2dc7ad-c6c8-4fe6-907e-0b9ecefd6bfc', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'f4c57e908a2c40af009a26d188cdbd6bc081f5c4d85b46a5cda740cd472f219c', '24e8107c-b45d-4bd3-ae15-58a32b412897', '2026-09-28 04:23:26.047', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '127.0.0.1', '2026-08-29 04:23:26.051');
INSERT INTO public.refresh_tokens (id, "userId", "tokenHash", "jwtId", "expiresAt", "revokedAt", "replacedByToken", "deviceInfo", "ipAddress", "createdAt") VALUES ('fb015c62-9ef1-4a7d-bc6e-de9117cec834', '04d45e4e-0c20-4deb-9d0c-f52b6740897e', 'ab90e3f9be8480eabb2723140a6f9237a5350d87913d6013c858389a49cecafa', '6eda60e0-dce4-4e15-a7ab-4544f1cbb83c', '2026-09-28 04:28:49.693', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '127.0.0.1', '2026-08-29 04:28:49.695');
INSERT INTO public.refresh_tokens (id, "userId", "tokenHash", "jwtId", "expiresAt", "revokedAt", "replacedByToken", "deviceInfo", "ipAddress", "createdAt") VALUES ('89f936de-4d5f-4338-ace7-7d9dfdec354b', '890e4b68-d955-448b-be92-b715f4b10807', '93efce872e5f03ded931e0ba362c7da01904be6f27a4e92c2ab791ee3eb83838', 'fcc02f54-5cfb-4fef-9544-1f34fce56543', '2026-09-28 04:33:22.691', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '127.0.0.1', '2026-08-29 04:33:22.693');


--
-- Data for Name: reminder_sent; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: role_approval_status; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: scheduled_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict cyDZtva2FZnXsYdPPUTCgfaxg9hf0YFv6pw2eshKDkCAXqqpJwSh0ZPKxVWrmOq

