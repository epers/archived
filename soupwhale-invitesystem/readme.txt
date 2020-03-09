Edit functions.h to reflect database locations (not needed if still /var/www/soupwhale/signup/database/keylist.db and invited.db)
Run make to compile executables
Executables can be renamed, they don't call eachother or anything like that.
Remember to suid getInvite executable to owner of keylist.db.
