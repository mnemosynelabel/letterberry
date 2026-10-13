-- Run this once in the Neon SQL editor (or via psql) to set up the letters table.

create table if not exists letters (
  id          bigint generated always as identity primary key,
  pen_name    text not null default 'A Wandering Berryfolk',
  category    text not null,
  message     text not null,
  pinned      boolean not null default false,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists letters_created_at_idx on letters (created_at desc);

-- To pin a letter so it shows in the "pinned letters" section:
--   update letters set pinned = true where id = <id>;
-- To unpin:
--   update letters set pinned = false where id = <id>;

-- To hide a letter from the board without deleting it:
--   update letters set hidden = true where id = <id>;
-- To restore it:
--   update letters set hidden = false where id = <id>;
