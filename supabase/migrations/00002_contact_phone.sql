-- Optional phone from device / manual entry (run after 00001)

alter table public.contacts
  add column if not exists phone text;
