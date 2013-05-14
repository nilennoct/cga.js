drop table if exists entries;
create table entries (
  	id integer primary key autoincrement,
  	userId integer,
  	title string not null,
  	text string not null
);

drop table if exists users;
create table users(
	id integer primary key autoincrement,
	username string not null,
	userpassword string not null 
);

drop table if exists friends;
create table friends(
	user1 integer not null,
	user2 integer not null
);