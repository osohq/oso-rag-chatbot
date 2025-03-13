-- team
insert into
public.team (name)
values
('hr'),
('engineering'),
('public');

-- folder
insert into
public.folder (team_id, name, is_public)
values
(1, 'hr', false),
(2, 'engineering', false),
(3, 'public', true);

-- document
insert into
public.document (folder_id, title)
values
(1, 'Bob internal review'),
(2, 'Bob external review'),
(3, 'Company holidays');

-- block
insert into
public.block (document_id, content)
values
(1, 'Alice says that Bob is horrible to work with'),
(2, 'Bob should work on being more collaborative.'),
(2, 'Bob should contribute more to design and architecture discussions.'),
(3, 'Every Friday and most Wednesdays are company holidays.'),
(3, 'Arbor Day is also a company holiday.');