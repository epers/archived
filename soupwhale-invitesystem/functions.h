/*
 * functions.h
 *
 * Contains various functions used by the invite tracking
 * system.
 *
 * Version 2.0 - Completely re-written (This time with slightly less drugs!)
 * Now with readable code and some semblance of organization!
 *
 * Author Contact: imaweasal@gmail.com
 */

#ifndef BELUGA_H
#define BELUGA_H

#include <iostream>
#include <fstream>
#include <stdlib.h>
#include <unistd.h>
#include <vector>
#include <sstream>
#include <string>
#include <string.h>
#include <strings.h>

#include "user.h"
#include "functions.h" // don't ask...

/*
 * Because I'm lazy.
 */
using namespace std;

/*
 * Change to suit the database location
 */
const string keylistFilename = "/var/www/soupwhale/signup/database/keylist.db";
const string inviteFilename = "/var/www/soupwhale/signup/database/invites.db";
//const string keylistFilename = "keylist.db"; //for testing
//const string inviteFilename = "invites.db"; //for testing

/*
 * Used in processInvites function
 */
struct Invite
{
  string invitedBy_;
  string inviteKeyUsed_;
  string wantedUserName_;
  string password_;
  string shell_;
  string email_;
};

/*
 * Character rot13 function.
 * rot13's a single character.
 */
char rot13 (char str)
{
  if (str >= 'a' && str <= 'm')
  {
    str += 13;
  }

  else if (str > 'm' && str <= 'z')
  {
    str -= 13;
  }

  else if (str >= 'A' && str <= 'M')
  {
    str += 13;
  }

  else if (str > 'M' && str <= 'Z')
  {
    str -= 13;
  }

  return str;
}

int readKeylistFile (vector <User> & userList)
{
  string userName;
  int numInvites;
  vector <string> inviteKeys;
  string key;
  string ignore; // used to ignore the "default"

  ifstream inFile;
  inFile.open (keylistFilename.c_str ());

  if (inFile.fail ())
  {
    cerr << "CRITICAL: Unable to open keylist file for reading." << endl;
    return 3;
  }

  while (true)
  {
    inFile >> userName;
    inFile >> numInvites;
    inFile >> ignore;
    for (int i = 0; i < numInvites; ++i)
    {
      inFile >> key;
      inviteKeys.push_back (key);
      key.clear ();
    }
    if (inFile.eof ())
    {
      break;
    }
    userList.push_back (User (userName, numInvites, inviteKeys));

    userName.clear ();
    numInvites = 0;
    ignore.clear ();
    inviteKeys.clear ();
  }
  inFile.close ();
  return 0;
}

int writeKeylistFile (vector <User> userList)
{
  ofstream outFile;
  outFile.open (keylistFilename.c_str ());

  if (outFile.fail ())
  {
    cerr << "CRITICAL: Unable to open keylist file for writing." << endl;
    return 4;
  }

  if (userList.size () == 1)
  {
    outFile << userList[0];
  }
  else
  {
    for (int i = 0; i < userList.size (); ++i)
    {
      outFile << userList [i];
    }
  }
  outFile.close ();
  return 0;
}

/*
 * inviteAdd function
 * Called by addinvite program to add an invite to a user
 */
int inviteAdd (string user)
{
  vector <User> userList;
  int returnVal = readKeylistFile (userList);
  if (returnVal != 0) // if there was a read error
  {
    return returnVal;
  }

  for (int i = 0; i < userList.size (); ++i)
  {
    if (rot13 (userList [i].userName ()) == user)
    {
      userList [i].addInvite ();
      cout << "Invite added." << endl;
      return writeKeylistFile (userList);
    }
  }

  /*
   * Add our user if they're not in the file
   */
  cout << "User " << user << " not found in the keylist database, adding them"
        << endl;

  userList.push_back (User (rot13 (user), 0));

  for (int i = 0; i < userList.size (); ++i)
  {
    if (rot13 (userList [i].userName ()) == user)
    {
      userList [i].addInvite ();
      cout << "Invite added." << endl;
      return writeKeylistFile (userList);
    }
  }

  /*
   * If that didn't work, something went very very wrong
   */
  cerr << "Something went very wrong here" << endl;
  return 5;
}

int getInvites (string userToRetrieve)
{
  vector <User> userList;
  int returnVal = readKeylistFile (userList);
  if (returnVal != 0)
  {
    return returnVal;
  }

  for (int i = 0; i < userList.size (); ++i)
  {
    if (userList [i].userName () == rot13 (userToRetrieve))
    {
      cout << "Here are your invite key(s)." << endl
      << "Give one to a friend however you want"
      << " and when they sign up, it'll be removed auto-magically" << endl
      << endl;
      for (int j = 0; j < userList [i].inviteKeys ().size (); ++j)
      {
        cout << userList [i].inviteKeys () [j] << endl;
      }
      return 0;
    }
  }

  cerr << "ERROR: User " << userToRetrieve
        << " was not found in the keylist database."
        << endl << "This means either you've never had invites or something "
        << "else went wrong.  Contact an admin for assistance." << endl;
  return 1;
}

int readInviteFile (vector <Invite> & inviteList)
{
  string tempInviteKeyUsed;
  string tempWantedUsername;
  string tempEmail;
  string tempPassword;
  string tempShell;
  string ignore;

  ifstream inFile;
  inFile.open (inviteFilename.c_str ());
  if (inFile.fail ())
  {
    cout << "CRITICAL: Unable to open invites file for reading.";
    return 5;
  }

  while (true)
  {
    inFile >> tempInviteKeyUsed;
    inFile >> ignore;
    inFile >> tempWantedUsername;
    inFile >> ignore;
    inFile >> tempPassword;
    inFile >> ignore;
    inFile >> tempShell;
    inFile >> ignore;
    inFile >> tempEmail;

    stringstream tempInvitedBy;
    for (int i = 0; tempInviteKeyUsed [i] != '#'; ++i)
    {
      tempInvitedBy << rot13 (tempInviteKeyUsed [i]);
    }
    Invite tempInvitee;
    tempInvitee.invitedBy_ = tempInvitedBy.str ();
    tempInvitee.inviteKeyUsed_ = tempInviteKeyUsed;
    tempInvitee.wantedUserName_ = tempWantedUsername;
    tempInvitee.shell_ = tempShell;
    tempInvitee.password_ = tempPassword;
    tempInvitee.email_ = tempEmail;

    if (inFile.eof ())
    {
      break;
    }
    inviteList.push_back (tempInvitee);

    tempInvitedBy.clear ();
    tempInviteKeyUsed.clear ();
    tempWantedUsername.clear ();
    tempEmail.clear ();
    tempPassword.clear ();
    tempShell.clear ();
  }
  inFile.close ();
  return 0;
}

int writeInviteFile (vector <Invite> inviteList)
{
  ofstream outFile;
  outFile.open (inviteFilename.c_str ());
  if (outFile.fail ())
  {
    cout << "CRITICAL: Unable to open invites file for writing." << endl;
    return 6;
  }

  for (int i = 0; i < inviteList.size (); ++i)
  {
    outFile << inviteList [i].inviteKeyUsed_ << " | "
    << inviteList [i].wantedUserName_ << " | "
    << inviteList [i].password_ << " | "
    << inviteList [i].shell_ << " | "
    << inviteList [i].email_ << endl;
  }
  outFile.close ();
  return 0;
}

int addUser (string userName, string password, string shell, string email)
{
  // determine what shell they wanted
  string actShell;
  if (shell == "bash")
    actShell = "/bin/bash";
  if (shell == "sh")
  actShell = "/bin/sh";
  else if (shell == "tcsh")
    actShell = "/usr/bin/tcsh";
  else if (shell == "zsh")
    actShell = "/usr/bin/zsh";
  else
    actShell = "/bin/bash"; // this shouldn't be reached, normally.

    stringstream useradd;
  cout << endl << "Adding user " << userName << '.' << endl;
  useradd << "useradd -m --base-dir /home  -s " << actShell << ' '
  << userName;
  //cout << useradd.str () << endl;
  system (useradd.str ().c_str ());

  // put together the chpasswd command
  stringstream chpasswd;
  chpasswd << "echo \"" << userName << ':' << password << "\" | chpasswd";
  //cout << chpasswd.str () << endl;
  system (chpasswd.str ().c_str ());

  // now call the /root/adduser.sh script
  stringstream script;
  script << "/root/adduser.sh " << userName;
  //cout << script.str () << endl;
  system (script.str ().c_str ());

  if (email != "null")
  {
    stringstream sendmail;
    sendmail << "echo \"Your soupwhale account has been created." << endl
    << "Hop in irc.soupwhale.com and join #soupwhale to chat!" << endl
    << "Connect over ssh by doing ssh <username>@ssh.soupwhale.com"
    << endl << "Enjoy!\""
    << " | mail -s \"Soupwhale Account Created!\" " << email;
    //cout << sendmail.str ();
    system (sendmail.str ().c_str ());
  }

  return 0;
}

int processInvites ()
{
  // read in invites file and keylist file
  vector <Invite> inviteList;
  int returnVal = readInviteFile (inviteList);
  if (returnVal != 0)
  {
    return returnVal;
  }

  vector <User> userList;
  returnVal = readKeylistFile (userList);
  if (returnVal != 0)
  {
    return returnVal;
  }

  if (inviteList.size () == 0)
  {
    cout << "No invites to be processed at this time, goodbye.";
    return 0;
  }

  // show ordered list of invites to be processed
  // <#>: <invitedby> <keyused> <wantedusername> <shell> <emailaddr>
  cout << "<#>: <invitedBy> <keyUsed> <wantedUsername> <shell> <email>" << endl;
  for (int i = 0; i < inviteList.size (); ++i)
  {
    cout << i << ": "
          << inviteList [i].invitedBy_ << ' '
          << inviteList [i].inviteKeyUsed_ << ' '
          << inviteList [i].shell_ << ' '
          << inviteList [i].email_ << endl;
  }

  int numToProcess;
  cout << endl << "Select an invite to process." << endl << "Input: ";
  cin >> numToProcess;
  while (numToProcess > inviteList.size () || numToProcess < 0)
  {
    cerr << "The # you selected is out of range, please try again." << endl
    << "Input: ";
    cin >> numToProcess;
  }

  cout << endl
      << "<#>: <invitedBy> <keyUsed> <wantedUsername> <shell> <email>" << endl
      << endl
      << numToProcess << ": "
      << inviteList [numToProcess].invitedBy_ << ' '
      << inviteList [numToProcess].inviteKeyUsed_ << ' '
      << inviteList [numToProcess].shell_ << ' '
      << inviteList [numToProcess].email_ << endl;

  char y_n;
  cout << "Accept invite? <y/n>" << endl << "Input <y/n>: ";
  cin >> y_n;
  while (y_n != 'y' && y_n != 'n')
  {
    cerr << "Your input was out of range, please try again." << endl
    << "Input <y/n>: ";
    cin >> y_n;
  }

  // if y - add user.
  if (y_n == 'y')
  {
    returnVal = addUser (inviteList [numToProcess].wantedUserName_,
                          inviteList [numToProcess].password_,
                          inviteList [numToProcess].shell_,
                          inviteList [numToProcess].email_);
  }
  if (returnVal != 0)
  {
    return returnVal;
  }

  // regardless, delete the invite key.
  for (int i = 0; i < userList.size (); ++i)
  {
    if (userList [i].userName () == rot13(inviteList [numToProcess].invitedBy_))
    {
      returnVal = userList [i].delInvite
                  (inviteList [numToProcess].inviteKeyUsed_);
      if (returnVal != 0)
      {
        cout << "ERROR: Key " << inviteList [numToProcess].inviteKeyUsed_ <<
        " was not found in " << inviteList [numToProcess].invitedBy_ <<
        "'s keylist.  This type of thing was assumed to be caught by the"
        << "web-end of things." << endl;
        return 7;
      }
    }
  }

  // erase invite application from vector.
  inviteList.erase (inviteList.begin () + numToProcess);

  // write changes to file.
  returnVal = writeKeylistFile (userList);
  if (returnVal != 0)
  {
    return returnVal;
  }

  return writeInviteFile (inviteList);
}

#endif
