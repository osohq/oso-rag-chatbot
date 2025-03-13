create extension if not exists "vector" with schema "extensions";

create sequence "public"."block_id_seq";

create sequence "public"."document_id_seq";

create sequence "public"."folder_id_seq";

create sequence "public"."team_id_seq";

create table "public"."block" (
    "id" integer not null default nextval('block_id_seq'::regclass),
    "document_id" integer,
    "content" text not null,
    "embedding" vector
);


create table "public"."document" (
    "id" integer not null default nextval('document_id_seq'::regclass),
    "folder_id" integer,
    "title" text not null
);


create table "public"."folder" (
    "id" integer not null default nextval('folder_id_seq'::regclass),
    "team_id" integer,
    "name" text not null,
    "is_public" boolean not null
);


create table "public"."team" (
    "id" integer not null default nextval('team_id_seq'::regclass),
    "name" text not null
);


alter sequence "public"."block_id_seq" owned by "public"."block"."id";

alter sequence "public"."document_id_seq" owned by "public"."document"."id";

alter sequence "public"."folder_id_seq" owned by "public"."folder"."id";

alter sequence "public"."team_id_seq" owned by "public"."team"."id";

CREATE UNIQUE INDEX block_pkey ON public.block USING btree (id);

CREATE UNIQUE INDEX document_pkey ON public.document USING btree (id);

CREATE UNIQUE INDEX folder_pkey ON public.folder USING btree (id);

CREATE UNIQUE INDEX team_pkey ON public.team USING btree (id);

alter table "public"."block" add constraint "block_pkey" PRIMARY KEY using index "block_pkey";

alter table "public"."document" add constraint "document_pkey" PRIMARY KEY using index "document_pkey";

alter table "public"."folder" add constraint "folder_pkey" PRIMARY KEY using index "folder_pkey";

alter table "public"."team" add constraint "team_pkey" PRIMARY KEY using index "team_pkey";

alter table "public"."block" add constraint "block_document_id_fkey" FOREIGN KEY (document_id) REFERENCES document(id) not valid;

alter table "public"."block" validate constraint "block_document_id_fkey";

alter table "public"."document" add constraint "document_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES folder(id) not valid;

alter table "public"."document" validate constraint "document_folder_id_fkey";

alter table "public"."folder" add constraint "folder_team_id_fkey" FOREIGN KEY (team_id) REFERENCES team(id) not valid;

alter table "public"."folder" validate constraint "folder_team_id_fkey";